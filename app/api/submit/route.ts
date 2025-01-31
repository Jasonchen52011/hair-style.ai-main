import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, hairStyle, hairColor } = await req.json();
    
    if (!imageUrl || !hairStyle || !hairColor) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 });
    }

    // 准备 FormData
    const formData = new FormData();
    formData.append("task_type", "async");
    
    // 判断是本地文件还是远程URL
    if (imageUrl.startsWith('http')) {
      // 如果是远程URL，直接使用URL
      formData.append("image_url", imageUrl);
    } else {
      // 如果是远程URL，获取图片数据
      const imageResponse = await fetch(imageUrl);
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

    // 检查是否上传成功并开始处理
    if (response.data.error_code === 0 && response.data.task_id) {
      try {
        // 等待 AI 处理完成并获取结果
        let result = null;
        for (let i = 0; i < 12; i++) {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

          const statusResponse = await axios({
            method: 'get',
            url: `${API_BASE_URL}/common/query-async-task-result`,
            headers: {
              'ailabapi-api-key': API_KEY,
              'Accept': 'application/json'
            },
            params: {
              task_id: response.data.task_id
            }
          });

          if (statusResponse.data.task_status === 2) {
            result = statusResponse.data;
            break;
          }
        }

        if (result && result.data.images) {
          const firstStyle = Object.keys(result.data.images)[0];
          return NextResponse.json({
            success: true,
            imageUrl: result.data.images[firstStyle][0],
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
