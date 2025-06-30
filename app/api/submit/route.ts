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

// 使用 Map 存储每个 taskId 的422错误计数
const taskErrorCount = new Map<string, number>();
const MAX_ERROR_COUNT = 5;

// 本地开发白名单IP
const LOCAL_WHITELIST_IPS = ['127.0.0.1', '::1', '0.0.0.0', 'localhost'];

// 性别检测函数
async function detectGender(imageBuffer: Buffer): Promise<'male' | 'female'> {
    try {
        // 使用 Google Gemini 检测性别
        const base64Image = imageBuffer.toString('base64');
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GOOGLE_API_KEY || ''
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: "Please analyze this photo and determine the gender of the person. Respond with only 'male' or 'female', nothing else."
                        },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const genderText = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim();
            
            if (genderText === 'male' || genderText === 'female') {
                return genderText as 'male' | 'female';
            }
        }
    } catch (error) {
        console.log('Gender detection failed, using default:', error);
    }
    
    // 默认返回女性
    return 'female';
}

export async function POST(req: NextRequest) {
    try {
        // 获取客户端 IP
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || headersList.get('x-real-ip') || '0.0.0.0';

        // 检查是否为本地开发环境或白名单IP
        const isLocalDev = process.env.NODE_ENV === 'development';
        const isWhitelistIP = LOCAL_WHITELIST_IPS.includes(ip);
        
        // IP 限制检查变量
        let currentCount;
        let today = new Date().toISOString().split('T')[0]; // 总是初始化today变量
        
        // 只在非本地开发环境且非白名单IP时进行限制检查
        if (!isLocalDev && !isWhitelistIP) {
            // IP 限制检查 - 先检查是否超限，但不立即计数
            currentCount = requestCounts.get(ip);

            // 检查是否已达到每日限制
            if (currentCount && currentCount.date === today && currentCount.count >= DAILY_LIMIT) {
                return NextResponse.json({
                    success: false,
                    error: 'You have reached your daily limit of 5 free generations. Please try again tomorrow.'
                }, { status: 429 });
            }
        }

        const { imageUrl, hairStyle, hairColor } = await req.json();
        
        if (!imageUrl || !hairColor) {
            return NextResponse.json({
                success: false,
                error: "Please make sure you've uploaded an image and selected a hair color."
            }, { status: 400 });
        }

        // 处理发型选择逻辑
        let finalHairStyle = hairStyle;
        
        // 如果没有选择发型或者选择了"color-only"，需要根据性别设置默认发型
        if (!hairStyle || hairStyle === "color-only") {
            let imageBuffer: Buffer | null = null;
            
            // 获取图片数据用于性别检测
            if (imageUrl.startsWith('http')) {
                try {
                    const imageResponse = await fetch(imageUrl);
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                } catch (error) {
                    console.error('Failed to fetch image for gender detection:', error);
                }
            } else if (imageUrl.startsWith('data:')) {
                try {
                    const base64Data = imageUrl.split(',')[1];
                    imageBuffer = Buffer.from(base64Data, 'base64');
                } catch (error) {
                    console.error('Failed to process base64 image for gender detection:', error);
                }
            } else {
                try {
                    imageBuffer = Buffer.from(imageUrl, 'base64');
                } catch (error) {
                    console.error('Failed to process image data for gender detection:', error);
                }
            }
            
            // 检测性别并设置默认发型
            if (imageBuffer) {
                const detectedGender = await detectGender(imageBuffer);
                finalHairStyle = detectedGender === 'male' ? 'SlickBack' : 'LongWavy';
                console.log(`Detected gender: ${detectedGender}, using default hairstyle: ${finalHairStyle}`);
            } else {
                // 如果无法检测性别，默认使用女性发型
                finalHairStyle = 'LongWavy';
                console.log('Failed to detect gender, using default female hairstyle: LongWavy');
            }
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
                    // assume it is a base64 string (no data: prefix)
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
            style: finalHairStyle,
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
            timeout: 10000 // keep consistent with client configuration
        });

        const responseData = response.data as any;
        console.log('API Response:', {
            status: response.status,
            error_code: responseData.error_code,
            task_id: responseData.task_id,
            error_detail: responseData.error_detail
        });

        if (responseData.error_code === 0 && responseData.task_id) {
            // only count after successfully calling AI API, and only count non-whitelist IP
            if (!isLocalDev && !isWhitelistIP) {
                if (!currentCount || currentCount.date !== today) {
                    requestCounts.set(ip, { count: 1, date: today });
                } else {
                    requestCounts.set(ip, {
                        count: currentCount.count + 1,
                        date: today
                    });
                }
            }
            
            return NextResponse.json({ 
                success: true,
                taskId: responseData.task_id,
                status: 'processing'
            });
        }
        
        // provide more specific error message based on different error codes
        let errorMessage = 'Unable to process this image. Please try a different photo.'; // more concise default message
        
        // only handle the most critical error, other cases use default message
        if (responseData.error_detail) {
            console.log('API Error Detail:', responseData.error_detail);
            
            // ensure error_detail is a string type before using includes method
            const errorDetail = String(responseData.error_detail);
            
            // only keep the most critical error judgment
            if (errorDetail.includes('face') && (errorDetail.includes('detect') || errorDetail.includes('recognition'))) {
                errorMessage = 'Please upload a photo with a clear, visible face.';
            }
           
        }
        
        return NextResponse.json({ 
            success: false,
            error: errorMessage,
            error_detail: responseData.error_detail,
            error_code: responseData.error_code
        }, { status: 422 }); 

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
    // query result
    const response = await fetch(
      `${API_BASE_URL}/common/query-async-task-result?task_id=${taskId}`,
      {
        headers: {
          "Content-Type": "application/json",  // GET request use application/json
          "ailabapi-api-key": apiKey
        }
      }
    );

    if (!response.ok) {
      // 如果是422状态码，记录错误次数
      if (response.status === 422) {
        const currentErrorCount = taskErrorCount.get(taskId) || 0;
        const newErrorCount = currentErrorCount + 1;
        taskErrorCount.set(taskId, newErrorCount);
        
        console.log(`Task ${taskId} received 422 error, count: ${newErrorCount}/${MAX_ERROR_COUNT}`);
        
        // 如果错误次数超过限制，返回友好提示并停止重试
        if (newErrorCount >= MAX_ERROR_COUNT) {
          // 清理错误计数
          taskErrorCount.delete(taskId);
          
          console.log(`Task ${taskId} exceeded max error count, returning timeout message`);
          
          return NextResponse.json({
            success: false,
            error: "We've been actively processing your image and found that your image might not be suitable for hairstyle changes. Please try with a photo that has better lighting and is taken closer. We'll give you a bonus try, hope you enjoy!",
            isTimeout: true,
            shouldStopPolling: true
          }, { status: 408 });
        }
      }
      
      throw new Error(`Status check failed with status ${response.status}`);
    }

    const statusData = await response.json();
    
    // 如果查询成功，清理该taskId的错误计数
    if (statusData && (statusData.task_status === 'SUCCESS' || statusData.task_status === 'FAILED')) {
      taskErrorCount.delete(taskId);
      console.log(`Task ${taskId} completed, cleared error count`);
    }
    
    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Query Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}