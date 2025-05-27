import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import axiosRetry from 'axios-retry';
import { headers } from 'next/headers';

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';

// 创建统一的 axios 实例
const client = axios.create({
    timeout: 10000, // 设置统一的超时时间为 10 秒
    validateStatus: (status) => status < 500 // 只有状态码 >= 500 才会被视为错误
});

// 配置重试机制
axiosRetry(client, { 
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 500; // 重试间隔缩短到 500ms
    },
    retryCondition: (error) => {
        // 如果是网络错误或服务器错误则重试
        if (error.message === 'Processing timeout') {
            error.message = 'We tried multiple times but still failed. Please try with a different photo.';
        }
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status >= 500;
    }
});

// 使用 Map 在内存中存储请求计数
const requestCounts = new Map<string, { count: number; date: string }>();
const DAILY_LIMIT = 5;

export async function POST(req: NextRequest) {
    try {
        // 获取客户端 IP
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || headersList.get('x-real-ip') || '0.0.0.0';

        // IP 限制检查 - 先检查是否超限，但不立即计数
        const today = new Date().toISOString().split('T')[0];
        const currentCount = requestCounts.get(ip);

        // 检查是否已达到每日限制
        if (currentCount && currentCount.date === today && currentCount.count >= DAILY_LIMIT) {
            return NextResponse.json({
                success: false,
                error: 'You have reached your daily limit of 5 free generations. Please try again tomorrow.'
            }, { status: 429 });
        }

        const { imageUrl, hairStyle, hairColor } = await req.json();
        
        if (!imageUrl || !hairStyle || !hairColor) {
            return NextResponse.json({
                success: false,
                error: "Please make sure you've selected both a hairstyle and hair color before proceeding."
            }, { status: 400 });
        }

        const formData = new FormData();
        formData.append("task_type", "async");
        
        if (imageUrl.startsWith('http')) {
            // 对于 HTTP/HTTPS URL，直接传递给 API
            formData.append("image_url", imageUrl);
        } else {
            // 对于非 HTTP URL，假设是 base64 data URL 或本地文件
            console.log('Processing non-HTTP imageUrl, length:', imageUrl.length);
            
            try {
                let buffer;
                
                if (imageUrl.startsWith('data:')) {
                    // 处理 data URL (base64)
                    const base64Data = imageUrl.split(',')[1];
                    if (!base64Data) {
                        throw new Error('Invalid data URL format');
                    }
                    buffer = Buffer.from(base64Data, 'base64');
                } else {
                    // 假设是 base64 字符串（没有 data: 前缀）
                    buffer = Buffer.from(imageUrl, 'base64');
                }
                
                formData.append("image", buffer, {
                    filename: 'image.jpg',
                    contentType: 'image/jpeg'
                });
                
                console.log('Successfully processed image buffer, size:', buffer.length);
                
            } catch (error) {
                console.error('Image processing error:', error);
                throw new Error(`Invalid image data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        formData.append("hair_data", JSON.stringify([{
            style: hairStyle,
            color: hairColor,
            num: 1
        }]));

        const response = await client({
            method: 'POST',
            url: `${API_BASE_URL}/portrait/effects/hairstyles-editor-pro`,
            headers: {
                "ailabapi-api-key": API_KEY,
                "Accept": "application/json",
                ...formData.getHeaders()
            },
            data: formData,
            timeout: 10000 // 保持与 client 配置一致
        });

        const responseData = response.data as any;
        console.log('API Response:', {
            status: response.status,
            error_code: responseData.error_code,
            task_id: responseData.task_id,
            error_detail: responseData.error_detail
        });

        if (responseData.error_code === 0 && responseData.task_id) {
            // 只有在成功调用 AI API 后才计数
            if (!currentCount || currentCount.date !== today) {
                requestCounts.set(ip, { count: 1, date: today });
            } else {
                requestCounts.set(ip, {
                    count: currentCount.count + 1,
                    date: today
                });
            }
            
            return NextResponse.json({ 
                success: true,
                taskId: responseData.task_id,
                status: 'processing'
            });
        }
        
        // 根据不同的错误码提供更具体的错误信息
        let errorMessage = 'This image might not work for hairstyle changes. Please try another photo.';
        
        if (responseData.error_detail) {
            console.log('API Error Detail:', responseData.error_detail);
            
            // 根据具体错误提供更友好的提示
            if (responseData.error_detail.includes('face') || responseData.error_detail.includes('人脸')) {
                errorMessage = 'No clear face detected in the image. Please upload a photo with a clear, front-facing portrait.';
            } else if (responseData.error_detail.includes('image') || responseData.error_detail.includes('图片')) {
                errorMessage = 'Image format or quality issue. Please try a different photo.';
            } else if (responseData.error_detail.includes('size') || responseData.error_detail.includes('大小')) {
                errorMessage = 'Image size issue. Please try a smaller or higher quality image.';
            }
        }
        
        return NextResponse.json({ 
            success: false,
            error: errorMessage,
            error_detail: responseData.error_detail,
            error_code: responseData.error_code
        }, { status: 422 }); // 使用 422 表示请求格式正确但无法处理

    } catch (error) {
        console.error('Submit error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'API key is not configured' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }
    // 查询处理结果
    const response = await fetch(
      `${API_BASE_URL}/common/query-async-task-result?task_id=${taskId}`,
      {
        headers: {
          "Content-Type": "application/json",  // GET 请求用 application/json
          "ailabapi-api-key": apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Status check failed with status ${response.status}`);
    }

    const statusData = await response.json();
    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Query Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}