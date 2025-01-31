import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import path from "path";
import FormData from "form-data";
import fs from "fs";

const API_KEY = process.env.AILABAPI_API_KEY;
const QUERY_URL = "https://www.ailabapi.com/api/common/query-async-task-result";
const API_BASE_URL = 'https://www.ailabapi.com/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hair-style.ai';

interface ApiResponse {
  request_id: string;
  log_id: string;
  error_code: number;
  error_code_str: string;
  error_msg: string;
  error_detail: {
    status_code: number;
    code: string;
    code_message: string;
    message: string;
  };
  task_type?: string;
  task_id?: string;
  data: {
    images?: {
      [key: string]: string[];
    };
    elements?: Array<{
      image_url: string;
      width: number;
      height: number;
      x: number;
      y: number;
    }>;
  };
}


// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 添加查询结果函数
async function getProcessResult(taskId: string, maxAttempts = 12): Promise<ApiResponse | null> {
  console.log('Starting task query with taskId:', taskId);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      // 每 5 秒查询一次
      if (i > 0) {
        await delay(5000);
      }

      const encodedTaskId = encodeURIComponent(taskId);
      const config = {
        method: "GET",
        maxBodyLength: Infinity,
        url: `${API_BASE_URL}/common/query-async-task-result?task_id=${encodedTaskId}`,
        headers: {
          "Content-Type": "application/json",
          "ailabapi-api-key": API_KEY
        }
      };

      const response = await axios(config);
      console.log(`Attempt ${i + 1} response:`, response.data);

      // 检查任务状态
      if (response.data.task_status === 2) { // 处理成功
        return response.data;
      }

      console.log(`Attempt ${i + 1}: Processing not complete, waiting 5 seconds...`);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error)
      if (i === maxAttempts - 1) throw error;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 创建新的 FormData 并正确设置
    const apiFormData = new FormData();
    apiFormData.append('image', image);

    const response = await axios.post(`${API_BASE_URL}/portrait/effects/hairstyles-editor-pro`, apiFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',  // 明确设置 Content-Type
        'ailabapi-api-key': API_KEY,
        ...apiFormData.getHeaders()
      },
      maxBodyLength: Infinity
    });

    // 检查响应
    if (response.data.error_code === 0 && response.data.task_id) {
      try {
        // 等待处理完成
        const processResult = await getProcessResult(response.data.task_id);
        if (processResult && processResult.data.images) {
          return NextResponse.json({ 
            success: true,
            imageUrl: processResult.data.images[0]
          });
        }
      } catch (processError) {
        console.error('Process Error:', processError);
        return NextResponse.json({ 
          success: false,
          error: '处理失败，请重试'
        });
      }
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
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
    const response = await axios({
      method: "get",
      url: QUERY_URL,
      headers: {
        "Content-Type": "application/json",
        "ailabapi-api-key": apiKey
      },
      params: { task_id: taskId }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Query Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}
