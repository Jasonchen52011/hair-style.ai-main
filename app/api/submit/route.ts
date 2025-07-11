import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import axiosRetry from 'axios-retry';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';

// 创建管理员客户端（绕过RLS）
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
const DAILY_LIMIT = 3; // 修改为3次免费

// 使用 Map 存储每个 taskId 的422错误计数
const taskErrorCount = new Map<string, number>();
const MAX_ERROR_COUNT = 5;

// 已扣费的任务追踪
const chargedTasks = new Set<string>();

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
        
        // 用户认证检查
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        let hasActiveSubscription = false;
        let userCredits = 0;
        
        if (user) {
            // 直接获取用户积分和订阅信息，避免内部 HTTP 调用
            // 现在可以使用普通客户端，因为RLS策略已经允许用户读取自己的积分
            try {
                // 检查用户的活跃订阅 - 订阅表仍需要管理员权限
                const { data: subscriptions, error: subscriptionError } = await adminSupabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .gte('end_date', new Date().toISOString());

                if (!subscriptionError && subscriptions && subscriptions.length > 0) {
                    hasActiveSubscription = true;
                }

                // 获取用户积分 - 现在可以使用普通客户端，因为RLS策略已修复
                const { data: creditRecords, error: creditsError } = await supabase
                    .from('credits')
                    .select('credits')
                    .eq('user_uuid', user.id)
                    .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

                if (!creditsError && creditRecords) {
                    userCredits = creditRecords.reduce((sum, record) => sum + (record.credits || 0), 0);
                    console.log(`User ${user.id} has ${userCredits} credits (via RLS)`);
                } else {
                    console.error('Credits query error:', creditsError);
                    // 如果RLS还有问题，回退到管理员客户端
                    const { data: fallbackCredits, error: fallbackError } = await adminSupabase
                        .from('credits')
                        .select('credits')
                        .eq('user_uuid', user.id)
                        .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());
                    
                    if (!fallbackError && fallbackCredits) {
                        userCredits = fallbackCredits.reduce((sum, record) => sum + (record.credits || 0), 0);
                        console.log(`User ${user.id} has ${userCredits} credits (via admin fallback)`);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
        
        // 限制检查逻辑
        let today = new Date().toISOString().split('T')[0];
        
        if (!user || !hasActiveSubscription) {
            // 未登录用户或非订阅会员：每天3次免费
            if (!isLocalDev && !isWhitelistIP) {
                const currentCount = requestCounts.get(ip);
                
                // 检查是否已达到每日免费限制
                if (currentCount && currentCount.date === today && currentCount.count >= DAILY_LIMIT) {
                    return NextResponse.json({
                        success: false,
                        error: user 
                            ? 'You have reached your daily limit of 3 free generations. Please subscribe to continue unlimited generation!' 
                            : 'You have reached your daily limit of 3 free generations. Please sign in and subscribe to continue unlimited generation!',
                        errorType: 'daily_limit',
                        requiresSubscription: true
                    }, { status: 429 });
                }
            }
        } else {
            // 订阅会员：检查积分是否足够
            if (userCredits < 10) {
                return NextResponse.json({
                    success: false,
                    error: 'You need at least 10 credits to generate a hairstyle. Please top up your credits!',
                    errorType: 'insufficient_credits',
                    currentCredits: userCredits,
                    requiredCredits: 10
                }, { status: 402 });
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
            // 成功调用AI API后的处理
            if (!user || !hasActiveSubscription) {
                // 未登录用户或非订阅会员：计数免费使用次数
                if (!isLocalDev && !isWhitelistIP) {
                    const currentCount = requestCounts.get(ip);
                    if (!currentCount || currentCount.date !== today) {
                        requestCounts.set(ip, { count: 1, date: today });
                    } else {
                        requestCounts.set(ip, {
                            count: currentCount.count + 1,
                            date: today
                        });
                    }
                }
            }
            // 注意：积分扣费现在移到生成成功时进行，避免生成失败时用户损失积分
            
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
    
    // 增加调试日志
    console.log(`Task ${taskId} status data:`, {
      task_status: statusData.task_status,
      type: typeof statusData.task_status,
      hasChargedBefore: chargedTasks.has(taskId)
    });
    
    // 如果查询成功，清理该taskId的错误计数
    if (statusData && (statusData.task_status === 2 || statusData.task_status === 'SUCCESS' || statusData.task_status === 3 || statusData.task_status === 'FAILED')) {
      taskErrorCount.delete(taskId);
      console.log(`Task ${taskId} completed, cleared error count`);
      
      // 如果生成成功且尚未扣费，执行积分扣费
      if ((statusData.task_status === 2 || statusData.task_status === 'SUCCESS') && !chargedTasks.has(taskId)) {
        console.log(`Attempting to consume credits for successful task ${taskId}`);
        try {
          // 获取当前用户信息
          const supabase = createRouteHandlerClient({ cookies });
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (user) {
            console.log(`Found user ${user.id} for task ${taskId}, checking credits`);
            // 直接检查用户当前积分，避免内部 HTTP 调用
            try {
              const { data: creditRecords, error: creditsError } = await supabase
                .from('credits')
                .select('credits')
                .eq('user_uuid', user.id)
                .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

              if (!creditsError && creditRecords) {
                const userCredits = creditRecords.reduce((sum, record) => sum + (record.credits || 0), 0);
                console.log(`User ${user.id} has ${userCredits} credits for task ${taskId}`);
                
                // 如果用户有足够积分（至少10积分），执行扣费
                if (userCredits >= 10) {
                  console.log(`Attempting to consume 10 credits for user ${user.id}, task ${taskId}`);
                  
                  // 生成交易编号
                  const timestamp = Date.now();
                  const random = Math.random().toString(36).substring(2, 8);
                  const transactionNo = `TXN_${timestamp}_${random}`.toUpperCase();

                  // 使用普通客户端插入积分扣费记录（已通过RLS策略允许用户插入自己的积分）
                  const { error: insertError } = await supabase
                    .from('credits')
                    .insert({
                      user_uuid: user.id,
                      trans_type: 'hairstyle',
                      trans_no: transactionNo,
                      order_no: null,
                      credits: -10, // 负数表示消费
                      expired_at: null,
                      created_at: new Date().toISOString()
                    });

                  if (!insertError) {
                    chargedTasks.add(taskId);
                    console.log(`Successfully consumed 10 credits for task ${taskId}, user: ${user.id}, transaction: ${transactionNo}`);
                  } else {
                    console.error(`Failed to consume credits for task ${taskId}:`, insertError);
                  }
                } else {
                  console.log(`User ${user.id} has insufficient credits (${userCredits}) for task ${taskId}, skipping charge`);
                }
              } else {
                console.error(`Failed to check credits for task ${taskId}:`, creditsError);
              }
            } catch (error) {
              console.error(`Error checking/consuming credits for task ${taskId}:`, error);
            }
          } else {
            console.log(`No user found for task ${taskId}`);
          }
        } catch (error) {
          console.error(`Error processing credits for task ${taskId}:`, error);
        }
      } else {
        console.log(`Skipping credit consumption for task ${taskId}: status=${statusData.task_status}, alreadyCharged=${chargedTasks.has(taskId)}`);
      }
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