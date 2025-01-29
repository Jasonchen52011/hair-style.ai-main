import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import path from "path";
import FormData from "form-data";
import fs from "fs";


const API_KEY = process.env.AILABAPI_API_KEY;
const QUERY_URL = "https://www.ailabapi.com/api/common/query-async-task-result";
const API_BASE_URL = 'https://www.ailabapi.com/api';

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
        },

      }

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
    // 1. 获取上传的文件和参数
    const reqJson = await req.json();
    const imageFileUrl = reqJson["imageUrl"];
    const hairStyle = reqJson["hairStyle"];
    const hairColor = reqJson["hairColor"];

    if (!imageFileUrl || !hairStyle || !hairColor) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // 准备 FormData
    const formData = new FormData();
    formData.append("task_type", "async");
    
    // 判断是本地文件还是远程URL
    if (imageFileUrl.startsWith('http')) {
      // 如果是远程URL，直接使用URL
      formData.append("image_url", imageFileUrl);
    } else {
      // 如果是本地文件路径，读取文件流
      const filePath = path.join(process.cwd(), "public", imageFileUrl);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({
          success: false,
          error: "Image file not found"
        }, { status: 404 });
      }
      
      formData.append("image", fs.createReadStream(filePath));
    }

    formData.append("hair_data", JSON.stringify([
      {
        style: hairStyle,
        color: hairColor,
        num: 1
      }
    ]));

    // 调用 AI API
    const response = await axios({
      method: 'POST',
      url: `${API_BASE_URL}/portrait/effects/hairstyles-editor-pro`,
      headers: {
        "ailabapi-api-key": API_KEY,
        "Accept": "application/json",
        ...formData.getHeaders()
      },
      data: formData,
      maxBodyLength: Infinity,
      validateStatus: (status) => status < 500
    });

    // 5. 检查是否上传成功并开始处理
    if (response.data.error_code === 0 && response.data.task_id) {
      try {
        // 6. 等待 AI 处理完成并获取结果
        const processResult = await getProcessResult(response.data.task_id);

        // 9. 如果处理成功，返回处理后的图片地址
        if (processResult && processResult.data.images) {
          const firstStyle = Object.keys(processResult.data.images)[0];
          const imageUrl = processResult.data.images[firstStyle][0];
          
          return NextResponse.json({ 
            success: true,
            imageUrl: imageUrl,
            styleName: hairStyle  // 添加发型名称到响应中
          });
        }
        
        // 如果处理超时
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
    
    // 如果上传失败
    return NextResponse.json({ 
      success: false,
      error: response.data.error_msg || '请求失败',
      error_detail: response.data.error_detail
    }, { status: response.data.error_detail.status_code || 400 });
    
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
