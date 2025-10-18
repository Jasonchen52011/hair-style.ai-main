import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createRouteClient } from '@/utils/supabase/route-handler';
import { getHairstyleProvider } from '@/lib/api-providers';

export const runtime = "edge";

// 强制日志 - 文件加载时立即执行
console.log('🔥🔥🔥 [ROUTE] submit/route.ts file loaded at', new Date().toISOString());

// 获取管理员客户端的函数（绕过RLS）
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Provider system handles retries and timeouts

// 使用 Map 在内存中存储请求计数（终身使用次数）
const lifetimeUsageCounts = new Map<string, number>(); // IP -> 终身使用次数
const LIFETIME_FREE_LIMIT = 5; // 终身5次免费

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

// Edge Runtime 按需清理过期缓存和统计的函数
function cleanupExpiredData() {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  // 清理过期缓存
  for (const [taskId, cache] of Array.from(completedTasksCache.entries())) {
    if (now - cache.timestamp > CACHE_DURATION) {
      completedTasksCache.delete(taskId);
      console.log(`🧹 Auto-cleaned expired cache for task ${taskId}`);
    }
  }
  
  // 清理过期的全局使用统计（保留昨天和今天的数据）
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  for (const [date] of Array.from(globalFreeUsage.entries())) {
    if (date !== today && date !== yesterday) {
      globalFreeUsage.delete(date);
      console.log(`🧹 Auto-cleaned expired global usage stats for ${date}`);
    }
  }
}

// 本地开发白名单IP - 临时扩展以解除限制
const LOCAL_WHITELIST_IPS = [
  '127.0.0.1', '::1', '0.0.0.0', 'localhost',
  '10.0.0.1', '192.168.1.1', '172.16.0.1', // 常见本地网络
  '::ffff:127.0.0.1', // IPv4-mapped IPv6
  'undefined' // 有时候IP获取可能为undefined
];


export async function POST(req: NextRequest) {
    try {
        console.log('🟢 [API] POST /api/submit - Request received');
        
        // Edge Runtime: 按需清理过期数据
        cleanupExpiredData();
        
        // 获取客户端 IP
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || headersList.get('x-real-ip') || '0.0.0.0';

        // 增强的本地开发检测 - 临时解除所有限制
        const isLocalDevEnhanced = process.env.NODE_ENV === 'development' || 
                                  LOCAL_WHITELIST_IPS.includes(ip) ||
                                  ip.startsWith('127.') || 
                                  ip.startsWith('192.168.') ||
                                  ip.startsWith('10.') ||
                                  ip.startsWith('172.16.') ||
                                  !ip || ip === 'undefined';
        
        console.log(`🔍 IP检测: ${ip}, isDev: ${process.env.NODE_ENV === 'development'}, isLocal: ${isLocalDevEnhanced}`);
        
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
        if ((!user || !hasActiveSubscription) && !isLocalDevEnhanced) {
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
            // 未登录用户或非订阅会员：终身5次免费
            if (!isLocalDevEnhanced) {
                const currentUsageCount = lifetimeUsageCounts.get(ip) || 0;
                
                // 检查是否已达到终身免费限制
                if (currentUsageCount >= LIFETIME_FREE_LIMIT) {
                    return NextResponse.json({
                        success: false,
                        error: user
                            ? 'You have used your 5 free generations. Please subscribe to continue unlimited generation!'
                            : 'You have used your 5 free generations. Please sign in and subscribe to continue unlimited generation!',
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
        
        console.log('📦 [API] Request body parsed:', {
            hasImageUrl: !!imageUrl,
            imageUrlPreview: imageUrl ? imageUrl.substring(0, 50) + '...' : 'none',
            hairStyle: hairStyle || 'undefined',
            hairColor: hairColor || 'undefined'
        });
        
        if (!imageUrl || !hairColor) {
            return NextResponse.json({
                success: false,
                error: "Please make sure you've uploaded an image and selected a hair color."
            }, { status: 400 });
        }

        // Use the Provider system to submit task
        const provider = getHairstyleProvider();
        console.log(`Using provider: ${provider.name}`);
        
        // 添加调试信息
        console.log(`🔍 Submitting task with params:`, {
            imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'none',
            hairStyle: hairStyle || 'LongWavy',
            hairColor: hairColor || 'brown'
        });

        const submitResult = await provider.submitTask({
            imageUrl,
            hairStyle: hairStyle || 'LongWavy', // Default if not specified
            hairColor
        });

        if (submitResult.success && submitResult.taskId) {
            // Task submitted successfully
            if (!user || !hasActiveSubscription) {
                if (!isLocalDevEnhanced) {
                    freeUserTasks.set(submitResult.taskId, { ip, date: today });
                    console.log(`🔄 Task ${submitResult.taskId} created for free user (IP: ${ip})`);
                }
            } else {
                console.log(`🔄 Task ${submitResult.taskId} created for user ${user.id}`);
            }
            
            return NextResponse.json({ 
                success: true,
                taskId: submitResult.taskId,
                status: 'processing',
                willDeductCredits: user && hasActiveSubscription ? 10 : 0,
                requiresSubscription: !user || !hasActiveSubscription
            });
        }
        
        // Handle submission errors
        let errorMessage = submitResult.error || "Photo not suitable for hairstyle changes.\nPlease check our guidelines.";
        
        if (submitResult.error_detail) {
            console.log('API Error Detail:', submitResult.error_detail);
            const errorDetail = String(submitResult.error_detail);
            
            if (errorDetail.includes('face') && (errorDetail.includes('detect') || errorDetail.includes('recognition'))) {
                errorMessage = "Photo not suitable for hairstyle changes.\nPlease check our guidelines.";
            }
        }
        
        return NextResponse.json({ 
            success: false,
            error: errorMessage,
            error_detail: submitResult.error_detail,
            error_code: submitResult.error_code,
            errorType: 'validation_error',
            shouldStopPolling: true
        }, { status: 422 }); 

    } catch (error) {
        console.error('Submit error:', error);
        
        // 判断是否为网络错误
        let errorType = 'unknown_error';
        let errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (error instanceof Error) {
            // 网络错误处理
            if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                errorType = 'network_timeout';
                errorMessage = 'Network request timed out. Please check your connection and try again.';
            } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                errorType = 'network_connection';
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else if (error.message.includes('network') || error.message.includes('Network') || error.message === 'Failed to fetch') {
                errorType = 'network_error';
                errorMessage = 'Network error occurred. Please check your connection and try again.';
            } else if (error.message.includes('We tried multiple times but still failed')) {
                errorType = 'retry_exhausted';
                errorMessage = error.message; // 使用我们自定义的重试失败消息
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
    // Edge Runtime: 按需清理过期数据
    cleanupExpiredData();
    
    // Use Provider system for status checking
    const provider = getHairstyleProvider();

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
    
    // Use Provider to query status
    const statusData = await provider.getTaskStatus(taskId);
    
    console.log(`Task ${taskId} status data:`, {
      task_status: statusData.task_status,
      hasChargedBefore: chargedTasks.has(taskId)
    });
    
    // Handle 422 errors (keeping original logic)
    if (!statusData || statusData.error_code === 422) {
      const currentErrorCount = taskErrorCount.get(taskId) || 0;
      const newErrorCount = currentErrorCount + 1;
      taskErrorCount.set(taskId, newErrorCount);
      
      console.log(`Task ${taskId} received 422 error, count: ${newErrorCount}/${MAX_ERROR_COUNT}`);
      
      if (newErrorCount >= MAX_ERROR_COUNT) {
        setTimeout(() => {
          taskErrorCount.delete(taskId);
        }, 60000);
        
        return NextResponse.json({
          success: false,
          error: "Sorry, your photo is not good enough for hairstyle changes.\nPlease check our guidelines.",
          isTimeout: true,
          shouldStopPolling: true,
          errorCount: newErrorCount
        }, { status: 422 });
      } else {
        return NextResponse.json({
          success: false,
          error: "Image validation in progress, please wait...",
          shouldContinuePolling: true,
          errorCount: newErrorCount
        }, { status: 422 });
      }
    }
    
    // Clear error count if successful
    if (statusData && (statusData.task_status === 2 || statusData.task_status === 'SUCCESS' || 
                       statusData.task_status === 3 || statusData.task_status === 'FAILED')) {
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