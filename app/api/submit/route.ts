import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import axiosRetry from 'axios-retry';

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';

// 创建统一的 axios 实例
const client = axios.create({
    timeout: 15000, // 设置统一的超时时间为 15 秒
    validateStatus: (status) => status < 500,
    maxBodyLength: Infinity
});

// 配置重试机制
axiosRetry(client, { 
    retries: 3, // 3次重试机会
    retryDelay: (retryCount) => {
        return retryCount * 5000; // 每5秒重试一次
    },
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status >= 500;
    }
});

// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
    try {
        const { imageUrl, hairStyle, hairColor } = await req.json();
        
        if (!imageUrl || !hairStyle || !hairColor) {
            return NextResponse.json({
                success: false,
                error: "Missing required fields"
            }, { status: 400 });
        }

        const formData = new FormData();
        formData.append("task_type", "async");
        
        if (imageUrl.startsWith('http')) {
            formData.append("image_url", imageUrl);
        } else {
            const imageResponse = await fetch(imageUrl, { 
                timeout: 10000 // 图片获取超时时间 10 秒
            });
            if (!imageResponse.ok) {
                throw new Error('Failed to fetch image');
            }
            const buffer = Buffer.from(await imageResponse.arrayBuffer());
            formData.append("image", buffer, {
                filename: 'image.jpg',
                contentType: 'image/jpeg'
            });
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
            data: formData
        });

        if (response.data.error_code === 0 && response.data.task_id) {
            // 等待处理完成
            for (let i = 0; i < 12; i++) { // 最多等待 60 秒
                if (i > 0) {
                    await delay(5000); // 每 5 秒查询一次
                }
                
                const result = await client.get(
                    `${API_BASE_URL}/common/query-async-task-result?task_id=${response.data.task_id}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "ailabapi-api-key": API_KEY
                        }
                    }
                );

                if (result.data.task_status === 2) { // 处理成功
                    return NextResponse.json({ 
                        success: true,
                        imageUrl: result.data.data.images[hairStyle][0],
                        styleName: hairStyle
                    });
                }
            }
        }
        
        return NextResponse.json({ 
            success: false,
            error: response.data.error_msg || '请求失败',
            error_detail: response.data.error_detail
        }, { status: response.data.error_detail?.status_code || 400 });

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
