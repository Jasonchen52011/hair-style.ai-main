import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import path from "path";
import FormData from "form-data";
import fs from "fs";

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';

// 定义具体的 API 端点
const API_ENDPOINTS = {
  HAIRSTYLE: `${API_BASE_URL}/portrait/effects/hairstyles-editor-pro`,
  QUERY_TASK: `${API_BASE_URL}/common/query-async-task-result`
} as const;

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

      if (response.data.task_status === 2) {
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
    const hairStyle = formData.get('hairStyle') || 'default';
    const hairColor = formData.get('hairColor') || 'default';
    
    if (!image) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields",
      }, { status: 400 });
    }

    // 创建新的 FormData
    const form = new FormData();

    // 处理图片数据
    if (image instanceof File) {
      // 读取文件内容
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 创建 Blob 对象
      const blob = new Blob([buffer], { type: image.type });
      
      // 添加文件到 FormData
      form.append('image', blob, image.name);
      form.append('task_type', 'async');
      
      // 添加发型数据
      form.append('hair_data', JSON.stringify([{
        style: hairStyle,
        color: hairColor,
        num: 1
      }]));

      // 发送请求
      const response = await axios({
        method: 'POST',
        url: `${API_BASE_URL}/portrait/effects/hairstyles-editor-pro`,
        data: form,
        headers: {
          'ailabapi-api-key': API_KEY,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });

      // 检查是否上传成功并开始处理
      if (response.data.error_code === 0 && response.data.task_id) {
        try {
          const processResult = await getProcessResult(response.data.task_id);
          if (processResult && processResult.data.images) {
            const firstStyle = Object.keys(processResult.data.images)[0];
            const imageUrl = processResult.data.images[firstStyle][0];
            
            return NextResponse.json({ 
              success: true,
              imageUrl: imageUrl,
              styleName: hairStyle
            });
          }
          
          return NextResponse.json({ 
            success: false,
            error: '处理超时，请稍后重试'
          });
        } catch (processError) {
          console.error('Process Error:', processError);
          return NextResponse.json({ 
            success: false,
            error: '处理失败，请重试'
          });
        }
      }
      
      return NextResponse.json({ 
        success: false,
        error: response.data.error_msg || '请求失败',
        error_detail: response.data.error_detail
      }, { status: response.data.error_detail?.status_code || 400 });
    } else {
      return NextResponse.json({
        success: false,
        error: "Invalid file format"
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
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
