import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import { Readable } from 'stream';

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';
const QUERY_URL = `${API_BASE_URL}/common/query-async-task-result`;

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
        url: `${QUERY_URL}?task_id=${encodedTaskId}`,
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
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxAttempts - 1) throw error;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, hairStyle, hairColor } = await req.json();
    
    if (!imageUrl || !hairStyle || !hairColor) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 });
    }

    // 获取图片数据
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();

    // 创建 FormData 实例
    const formData = new FormData();
    formData.append('task_type', 'async');
    
    // 添加图片数据
    const blob = new Blob([imageArrayBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'image.jpg');
    
    // 添加发型数据
    formData.append('hair_data', JSON.stringify([{
      style: hairStyle,
      color: hairColor,
      num: 1
    }]));

    // 发送请求到 AI API
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/portrait/effects/hairstyles-editor-pro`,
      data: formData,
      headers: {
        'ailabapi-api-key': API_KEY,
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      maxBodyLength: Infinity,
      timeout: 60000
    });

    if (!response.data || response.data.error_code !== 0) {
      throw new Error(response.data?.error_msg || 'API request failed');
    }

    const taskId = response.data.task_id;
    if (!taskId) {
      throw new Error('No task ID returned');
    }

    // 轮询获取结果
    let result = null;
    for (let i = 0; i < 12; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      const statusResponse = await axios({
        method: 'get',
        url: `${API_BASE_URL}/common/query-async-task-result`,
        params: { task_id: taskId },
        headers: {
          'ailabapi-api-key': API_KEY
        }
      });

      if (statusResponse.data.task_status === 2) {
        result = statusResponse.data;
        break;
      }
    }

    if (!result || !result.data.images) {
      throw new Error('Processing failed or timed out');
    }

    const firstStyle = Object.keys(result.data.images)[0];
    return NextResponse.json({
      success: true,
      imageUrl: result.data.images[firstStyle][0],
      styleName: hairStyle
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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
      url: `${API_BASE_URL}/common/query-async-task-result?task_id=${taskId}`,
      headers: {
        "Content-Type": "application/json",  // GET 请求用 application/json
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
