import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import axiosRetry from 'axios-retry';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createRouteClient } from '@/utils/supabase/route-handler';

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';

// 获取管理员客户端的函数（绕过RLS）
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// 创建统一的 axios 实例
const client = axios.create({
    timeout: 15000, // 增加超时时间到 15 秒
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

// 使用 Map 在内存中存储请求计数（终身使用次数）
const lifetimeUsageCounts = new Map<string, number>(); // IP -> 终身使用次数
const LIFETIME_FREE_LIMIT = 1; // 终身1次免费

// 全局免费使用次数统计
const globalFreeUsage = new Map<string, number>(); // date -> successfulCount
const GLOBAL_DAILY_FREE_LIMIT = 2000; // 每天2000次免费成功调用

// 使用 Map 存储每个 taskId 的422错误计数
const taskErrorCount = new Map<string, number>();
const MAX_ERROR_COUNT = 2;

// 已扣费的任务追踪
const chargedTasks = new Set<string>();

// 未登录用户任务追踪（存储 taskId -> {ip, date}）
const freeUserTasks = new Map<string, { ip: string; date: string }>();

// 已扣次数的免费任务追踪
const chargedFreeTasks = new Set<string>();

// 用户认证缓存（缓存5分钟）
const userAuthCache = new Map<string, { user: any; timestamp: number }>();
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5分钟

// 已完成任务结果缓存（缓存24小时）
const completedTasksCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时，符合API文档说明

// 定期清理过期缓存和统计（每小时执行一次）
setInterval(() => {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  // 清理过期缓存
  for (const [taskId, cache] of completedTasksCache.entries()) {
    if (now - cache.timestamp > CACHE_DURATION) {
      completedTasksCache.delete(taskId);
      console.log(`🧹 Auto-cleaned expired cache for task ${taskId}`);
    }
  }
  
  // 清理过期的全局使用统计（保留昨天和今天的数据）
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  for (const [date] of globalFreeUsage.entries()) {
    if (date !== today && date !== yesterday) {
      globalFreeUsage.delete(date);
      console.log(`🧹 Auto-cleaned expired global usage stats for ${date}`);
    }
  }
}, 60 * 60 * 1000); // 每小时清理一次

// 本地开发白名单IP
const LOCAL_WHITELIST_IPS = ['127.0.0.1', '::1', '0.0.0.0', 'localhost'];


export async function POST(req: NextRequest) {
    try {
        // 获取客户端 IP
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || headersList.get('x-real-ip') || '0.0.0.0';

        // 检查是否为本地开发环境或白名单IP
        const isLocalDev = process.env.NODE_ENV === 'development' && LOCAL_WHITELIST_IPS.includes(ip);
        const isWhitelistIP = LOCAL_WHITELIST_IPS.includes(ip);
        
        // 用户认证检查
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        let hasActiveSubscription = false;
        let userCredits = 0;
        
        if (user) {
            // 直接获取用户积分和订阅信息，避免内部 HTTP 调用
            // 现在可以使用普通客户端，因为RLS策略已经允许用户读取自己的积分
            try {
                // 检查用户的活跃订阅 - 订阅表仍需要管理员权限
                const { data: subscriptions, error: subscriptionError } = await getAdminSupabase()
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .gte('end_date', new Date().toISOString());

                if (!subscriptionError && subscriptions && subscriptions.length > 0) {
                    hasActiveSubscription = true;
                }

                // 获取用户积分 - 从user_credits_balance表获取balance
                const { data: balance, error: balanceError } = await supabase
                    .from('user_credits_balance')
                    .select('balance')
                    .eq('user_uuid', user.id)
                    .single();

                if (!balanceError && balance) {
                    userCredits = balance.balance || 0;
                    console.log(`User ${user.id} has ${userCredits} credits (from user_credits_balance)`);
                } else {
                    console.error('Balance query error:', balanceError);
                    // 如果查询失败，回退到管理员客户端
                    const { data: fallbackBalance, error: fallbackError } = await getAdminSupabase()
                        .from('user_credits_balance')
                        .select('balance')
                        .eq('user_uuid', user.id)
                        .single();
                    
                    if (!fallbackError && fallbackBalance) {
                        userCredits = fallbackBalance.balance || 0;
                        console.log(`User ${user.id} has ${userCredits} credits (via admin fallback)`);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
        
        // 限制检查逻辑
        let today = new Date().toISOString().split('T')[0];
        
        // 检查全局免费使用额度（只对免费用户限制）
        if ((!user || !hasActiveSubscription) && !isLocalDev && !isWhitelistIP) {
            const currentGlobalUsage = globalFreeUsage.get(today) || 0;
            if (currentGlobalUsage >= GLOBAL_DAILY_FREE_LIMIT) {
                return NextResponse.json({
                    success: false,
                    error: 'Our daily free usage quota has been reached. Please try again tomorrow.',
                    errorType: 'global_quota_exceeded'
                }, { status: 429 });
            }
        }
        
        if (!user || !hasActiveSubscription) {
            // 未登录用户或非订阅会员：终身1次免费
            if (!isLocalDev && !isWhitelistIP) {
                const currentUsageCount = lifetimeUsageCounts.get(ip) || 0;
                
                // 检查是否已达到终身免费限制
                if (currentUsageCount >= LIFETIME_FREE_LIMIT) {
                    return NextResponse.json({
                        success: false,
                        error: user 
                            ? 'You have used your free generation. Please subscribe to continue unlimited generation!' 
                            : 'You have used your free generation. Please sign in and subscribe to continue unlimited generation!',
                        errorType: 'lifetime_limit',
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
        
        // 如果没有选择发型或者选择了"color-only"，使用默认发型
        if (!hairStyle || hairStyle === "color-only") {
            finalHairStyle = 'LongWavy'; // 默认使用女性发型
            console.log('No hairstyle selected, using default: LongWavy');
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
                // ✅ 未登录用户或非订阅会员：记录任务信息，等待任务成功完成时再扣次数
                if (!isLocalDev && !isWhitelistIP) {
                    freeUserTasks.set(responseData.task_id, { ip, date: today });
                    console.log(`🔄 Task ${responseData.task_id} created for free user (IP: ${ip}), lifetime usage will be deducted upon success`);
                }
            } else {
                // ✅ 不立即扣除积分，等待任务成功完成时再扣除
                console.log(`🔄 Task ${responseData.task_id} created for user ${user.id}, credits will be deducted upon success`);
                console.log(`📊 User current credits: ${userCredits}, required: 10`);
            }
            
            return NextResponse.json({ 
                success: true,
                taskId: responseData.task_id,
                status: 'processing',
                willDeductCredits: user && hasActiveSubscription ? 10 : 0,
                requiresSubscription: !user || !hasActiveSubscription
            });
        }
        
        // provide more specific error message based on different error codes
        let errorMessage = "Photo not suitable for hairstyle changes.\nPlease check our guidelines.";
        
        // only handle the most critical error, other cases use default message
        if (responseData.error_detail) {
            console.log('API Error Detail:', responseData.error_detail);
            
            // ensure error_detail is a string type before using includes method
            const errorDetail = String(responseData.error_detail);
            
            // only keep the most critical error judgment
            if (errorDetail.includes('face') && (errorDetail.includes('detect') || errorDetail.includes('recognition'))) {
                errorMessage = "Photo not suitable for hairstyle changes.\nPlease check our guidelines.";
            }
           
        }
        
        return NextResponse.json({ 
            success: false,
            error: errorMessage,
            error_detail: responseData.error_detail,
            error_code: responseData.error_code,
            errorType: 'validation_error', // 明确标识为图片验证错误
            shouldStopPolling: true // 添加这个标记，让前端立即停止
        }, { status: 422 }); 

    } catch (error) {
        console.error('Submit error:', error);
        
        // 判断是否为网络错误
        let errorType = 'unknown_error';
        let errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (error instanceof Error) {
            // Axios 网络错误
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorType = 'network_timeout';
                errorMessage = 'Network request timed out. Please check your connection and try again.';
            } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                errorType = 'network_connection';
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else if (error.message.includes('network') || error.message.includes('Network')) {
                errorType = 'network_error';
                errorMessage = 'Network error occurred. Please check your connection and try again.';
            }
        }
        
        return NextResponse.json({ 
            success: false, 
            error: errorMessage,
            errorType: errorType,
            details: process.env.NODE_ENV === 'development' ? error : undefined
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

    // 检查缓存中是否有已完成的任务结果
    const cachedResult = completedTasksCache.get(taskId);
    if (cachedResult) {
      const isExpired = Date.now() - cachedResult.timestamp > CACHE_DURATION;
      if (!isExpired) {
        console.log(`✅ Returning cached result for task ${taskId}`);
        // 为缓存结果添加轮询指导信息
        const response = {
          ...cachedResult.result,
          fromCache: true,
          nextPollTime: null // 已完成的任务不需要再轮询
        };
        return NextResponse.json(response);
      } else {
        // 清理过期缓存
        completedTasksCache.delete(taskId);
        console.log(`🧹 Cleaned expired cache for task ${taskId}`);
      }
    }
    
    // query result with timeout
    const response = await fetch(
      `${API_BASE_URL}/common/query-async-task-result?task_id=${taskId}`,
      {
        headers: {
          "Content-Type": "application/json",  // GET request use application/json
          "ailabapi-api-key": apiKey
        },
        signal: AbortSignal.timeout(5000) // 5秒超时，根据API文档建议优化
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
          // 不要立即清理错误计数，等待一段时间后再清理，避免重复计数
          setTimeout(() => {
            taskErrorCount.delete(taskId);
            console.log(`Cleaned up error count for task ${taskId} after delay`);
          }, 60000); // 60秒后清理
          
          console.log(`Task ${taskId} exceeded max error count, returning 422 with stop flag`);
          
          return NextResponse.json({
            success: false,
            error: "Sorry, your photo is not good enough for hairstyle changes.\nPlease check our guidelines.",
            isTimeout: true,
            shouldStopPolling: true,
            errorCount: newErrorCount
          }, { status: 422 });
        } else {
          // 第一次422错误，返回提示继续轮询
          return NextResponse.json({
            success: false,
            error: "Image validation in progress, please wait...",
            shouldContinuePolling: true,
            errorCount: newErrorCount
          }, { status: 422 });
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
      
      // 清理失败任务的免费用户追踪记录
      if (statusData.task_status === 3 || statusData.task_status === 'FAILED') {
        if (freeUserTasks.has(taskId)) {
          freeUserTasks.delete(taskId);
          console.log(`🧹 Cleaned up failed free user task ${taskId}`);
        }
      }
      
      // ✅ 只有在任务成功完成时才扣除积分
      if ((statusData.task_status === 2 || statusData.task_status === 'SUCCESS')) {
        // 快速检查内存缓存，避免重复处理
        if (!chargedTasks.has(taskId)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Task ${taskId} completed successfully, starting credit deduction process`);
          }
          
                      try {
              const supabase = await createRouteClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (process.env.NODE_ENV === 'development') {
              console.log(`👤 User check for task ${taskId}: user = ${user?.id}, error = ${userError?.message}`);
            }
            
            if (user) {
              // 并行查询订阅状态和已有积分记录
              const [subscriptionsResult, existingCreditResult] = await Promise.all([
                getAdminSupabase()
                  .from('subscriptions')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('status', 'active')
                  .gte('end_date', new Date().toISOString())
                  .limit(1),
                getAdminSupabase()
                  .from('credits')
                  .select('trans_no, credits, created_at')
                  .eq('user_uuid', user.id)
                  .eq('task_id', taskId)
                  .eq('trans_type', 'hairstyle')
                  .single()
              ]);

              const hasActiveSubscription = !subscriptionsResult.error && subscriptionsResult.data && subscriptionsResult.data.length > 0;
              
              // 检查用户是否有积分余额（订阅用户或购买积分的用户）
              const { data: userBalance, error: balanceCheckError } = await getAdminSupabase()
                .from('user_credits_balance')
                .select('balance')
                .eq('user_uuid', user.id)
                .single();
              
              const hasCredits = !balanceCheckError && userBalance && userBalance.balance > 0;
              
              if (hasActiveSubscription || hasCredits) {
                const { data: existingCredit, error: checkError } = existingCreditResult;

                if (checkError && checkError.code !== 'PGRST116') {
                  console.error('❌ Error checking existing credit:', checkError);
                } else if (existingCredit) {
                  console.log(`✅ Credits already deducted for task ${taskId}, user ${user.id}`, existingCredit);
                  chargedTasks.add(taskId);
                  
                  // 在响应中添加积分扣除信息
                  statusData.creditsDeducted = 10;
                  statusData.creditTransaction = existingCredit.trans_no;
                } else {
                  console.log(`🔄 No existing credit found, proceeding with deduction for successful task ${taskId}`);
                  
                  // 获取用户当前积分
                  const { data: balance, error: balanceError } = await getAdminSupabase()
                    .from('user_credits_balance')
                    .select('balance')
                    .eq('user_uuid', user.id)
                    .single();

                  if (!balanceError && balance && balance.balance >= 10) {
                    // 生成交易编号
                    const timestamp = Date.now();
                    const random = Math.random().toString(36).substring(2, 8);
                    const transactionNo = `TXN_${timestamp}_${random}`.toUpperCase();
                    
                    console.log(`🔄 Generated transaction number: ${transactionNo}`);

                    // 优化：使用更快的单次操作
                    const updateResult = await getAdminSupabase()
                      .from('user_credits_balance')
                      .update({
                        balance: balance.balance - 10,
                        updated_at: new Date().toISOString()
                      })
                      .eq('user_uuid', user.id);

                                         let insertResult: { error: any } = { error: null };
                     if (!updateResult.error) {
                       insertResult = await getAdminSupabase()
                        .from('credits')
                        .insert({
                          user_uuid: user.id,
                          trans_type: 'hairstyle',
                          trans_no: transactionNo,
                          order_no: null,
                          credits: -10,
                          expired_at: null,
                          created_at: new Date().toISOString(),
                          event_type: 'hairstyle_usage',
                          task_id: taskId
                        });
                    }

                    if (!insertResult.error && !updateResult.error) {
                      chargedTasks.add(taskId);
                      console.log(`✅ Credits deducted on success: ${balance.balance} -> ${balance.balance - 10} for user ${user.id}, task ${taskId}`);
                      console.log(`✅ Transaction completed: ${transactionNo}`);
                      
                      // 在响应中添加积分扣除信息
                      statusData.creditsDeducted = 10;
                      statusData.newCreditBalance = balance.balance - 10;
                      statusData.creditTransaction = transactionNo;
                    } else {
                      console.error(`❌ Failed to deduct credits for successful task ${taskId}:`, insertResult.error || updateResult.error);
                    }
                  } else {
                    console.log(`⚠️  User ${user.id} has insufficient credits for task ${taskId}`);
                  }
                }
              } else {
                console.log(`📝 Task ${taskId} completed for non-subscription user, no credits to deduct`);
              }
            }
          } catch (error) {
            console.error(`❌ Error processing credit deduction for completed task ${taskId}:`, error);
          }
          
          // ✅ 处理未登录用户的免费次数扣除
          const freeTaskInfo = freeUserTasks.get(taskId);
          if (freeTaskInfo && !chargedFreeTasks.has(taskId)) {
            console.log(`🔄 Processing free user task ${taskId} lifetime usage count deduction for IP: ${freeTaskInfo.ip}`);
            
            // 更新终身使用次数
            const currentUsageCount = lifetimeUsageCounts.get(freeTaskInfo.ip) || 0;
            lifetimeUsageCounts.set(freeTaskInfo.ip, currentUsageCount + 1);
            
            // 更新全局免费使用统计
            const todayGlobalUsage = globalFreeUsage.get(freeTaskInfo.date) || 0;
            globalFreeUsage.set(freeTaskInfo.date, todayGlobalUsage + 1);
            console.log(`🌍 Global free usage updated: ${todayGlobalUsage + 1}/${GLOBAL_DAILY_FREE_LIMIT} for ${freeTaskInfo.date}`);
            
            chargedFreeTasks.add(taskId);
            freeUserTasks.delete(taskId);
            console.log(`✅ Free usage deducted for IP ${freeTaskInfo.ip} (${currentUsageCount + 1}/${LIFETIME_FREE_LIMIT}), task ${taskId}`);
            
            // 在响应中添加扣次数信息
            statusData.freeUsageDeducted = 1;
            statusData.lifetimeUsageRemaining = LIFETIME_FREE_LIMIT - (currentUsageCount + 1);
            statusData.globalFreeUsageRemaining = GLOBAL_DAILY_FREE_LIMIT - (todayGlobalUsage + 1);
          }
        } else {
          console.log(`✅ Task ${taskId} completed and credits were already deducted`);
          
          // 为已扣费的任务也添加积分信息到响应中
          statusData.creditsDeducted = 10;
          
          // 为已处理的免费任务也显示剩余额度
          if (chargedFreeTasks.has(taskId)) {
            const today = new Date().toISOString().split('T')[0];
            const todayGlobalUsage = globalFreeUsage.get(today) || 0;
            statusData.globalFreeUsageRemaining = Math.max(0, GLOBAL_DAILY_FREE_LIMIT - todayGlobalUsage);
          }
        }
      }
    } else {
      console.log(`Skipping processing for task ${taskId}: status=${statusData.task_status}`);
    }
    
    // 检查任务是否已完成，如果是则缓存结果
    const isCompleted = statusData.task_status === 2 || statusData.task_status === 'SUCCESS' || 
                       statusData.task_status === 3 || statusData.task_status === 'FAILED';
    
    if (isCompleted) {
      // 缓存已完成的任务结果
      completedTasksCache.set(taskId, {
        result: statusData,
        timestamp: Date.now()
      });
      console.log(`💾 Cached completed task result for ${taskId}`);
      
      // 已完成任务不需要轮询指导
      statusData.nextPollTime = null;
      statusData.shouldStopPolling = true;
    } else {
      // 正在处理的任务，添加轮询指导（按照API文档建议每5秒查询一次）
      statusData.nextPollTime = Date.now() + 5000; // 5秒后再查询
      statusData.pollInterval = 5000; // 建议轮询间隔
      statusData.shouldStopPolling = false;
    }
    
    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Query Error:', error);
    
    // 判断错误类型
    let errorType = 'unknown_error';
    let errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorType = 'network_timeout';
        errorMessage = 'Query request timed out. The server might be busy, please try again.';
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        errorType = 'network_connection';
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        errorType = 'network_error';
        errorMessage = 'Network error occurred while checking status. Please try again.';
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      errorType: errorType
    }, { status: 500 });
  }
}