import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import axiosRetry from 'axios-retry';
import { headers } from 'next/headers';
import { 
  validateUserId, 
  getUserCredits, 
  updateUserCredits, 
  checkActiveSubscription,
  getSimpleDbClient
} from "@/lib/simple-auth";

const API_KEY = process.env.AILABAPI_API_KEY;
const API_BASE_URL = 'https://www.ailabapi.com/api';

// 本地白名单IP（用于测试）
const LOCAL_WHITELIST_IPS = ['127.0.0.1', '::1', '0.0.0.0'];
const DAILY_LIMIT = 3;

// 内存存储请求计数（生产环境应该使用 Redis）
const requestCounts = new Map<string, { count: number; date: string }>();

// 创建统一的 axios 实例
const client = axios.create({
    timeout: 10000,
    validateStatus: (status) => status < 500
});

// 配置重试机制
axiosRetry(client, { 
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 500;
    },
    retryCondition: (error) => {
        if (error.message === 'Processing timeout') {
            error.message = 'We tried multiple times but still failed. Please try with a different photo.';
        }
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status >= 500;
    }
});

// 从请求中提取 userId 的辅助函数
function extractUserIdFromRequest(request: NextRequest): string | null {
  // 1. 从 header 中获取
  const headerUserId = request.headers.get('x-user-id') || request.headers.get('user-id');
  if (headerUserId) {
    return headerUserId;
  }

  // 2. 从 query 参数中获取
  const queryUserId = request.nextUrl.searchParams.get('userId');
  if (queryUserId) {
    return queryUserId;
  }

  return null;
}

// API 响应类型定义
interface APIResponse {
  task_id?: string;
  message?: string;
  [key: string]: any;
}

interface TaskResult {
  status: string;
  result?: any;
  [key: string]: any;
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
        
        // 🔥 使用新的简化验证方式
        const userId = extractUserIdFromRequest(req);
        
        let hasActiveSubscription = false;
        let userCredits = 0;
        
        if (userId) {
            // 验证用户ID
            const validation = await validateUserId(userId);
            if (!validation.valid) {
                return NextResponse.json({
                    success: false,
                    error: `Invalid user: ${validation.error}`,
                    errorType: 'invalid_user'
                }, { status: 401 });
            }

            try {
                // 检查用户的活跃订阅
                hasActiveSubscription = await checkActiveSubscription(userId);
                
                // 获取用户积分
                userCredits = await getUserCredits(userId);
                console.log(`User ${userId} has ${userCredits} credits`);
            } catch (error) {
                console.error('Error fetching user data:', error);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch user data',
                    errorType: 'database_error'
                }, { status: 500 });
            }
        }
        
        // 限制检查逻辑
        let today = new Date().toISOString().split('T')[0];
        
        if (!userId || !hasActiveSubscription) {
            // 未登录用户或非订阅会员：每天3次免费
            if (!isLocalDev && !isWhitelistIP) {
                const currentCount = requestCounts.get(ip);
                
                if (currentCount && currentCount.date === today && currentCount.count >= DAILY_LIMIT) {
                    return NextResponse.json({
                        success: false,
                        error: userId 
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

        const { imageUrl, hairStyle, hairColor, userId: bodyUserId } = await req.json();
        
        // 如果 body 中有 userId，使用它
        const finalUserId = bodyUserId || userId;
        
        if (!imageUrl || !hairColor) {
            return NextResponse.json({
                success: false,
                error: "Please make sure you've uploaded an image and selected a hair color."
            }, { status: 400 });
        }

        // 处理发型选择逻辑
        let finalHairStyle = hairStyle;
        
        if (!finalHairStyle) {
            // 如果没有选择发型，尝试自动检测性别
            try {
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(imageResponse.data as ArrayBuffer);
                const detectedGender = await detectGender(imageBuffer);
                
                const defaultStyles = {
                    male: 'man bun',
                    female: 'long hair'
                };
                
                finalHairStyle = defaultStyles[detectedGender];
                console.log(`Auto-detected gender: ${detectedGender}, using style: ${finalHairStyle}`);
            } catch (genderError) {
                console.error('Gender detection failed:', genderError);
                finalHairStyle = 'natural hair';
            }
        }

        // 准备 API 请求数据
        const form = new FormData();
        form.append('image', imageUrl);
        form.append('style', finalHairStyle);
        form.append('color', hairColor);

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${API_BASE_URL}/portrait/effects/hairstyle-editor-pro`,
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                ...form.getHeaders()
            },
            data: form
        };

        console.log('Submitting to AI API with config:', {
            url: config.url,
            style: finalHairStyle,
            color: hairColor,
            hasAuth: !!API_KEY
        });

        const response = await client(config);
        
        if (response.status !== 200) {
            console.error('API error:', response.data);
            return NextResponse.json({
                success: false,
                error: (response.data as APIResponse)?.message || 'API request failed',
                debug: response.data
            }, { status: response.status });
        }

        const apiResponse = response.data as APIResponse;
        const taskId = apiResponse.task_id;
        
        if (!taskId) {
            console.error('No task ID in response:', response.data);
            return NextResponse.json({
                success: false,
                error: 'No task ID received from AI service',
                debug: response.data
            }, { status: 500 });
        }

        // 🔥 使用简化方式扣除积分
        if (finalUserId && hasActiveSubscription) {
            try {
                const newCredits = userCredits - 10;
                await updateUserCredits(finalUserId, newCredits);
                
                // 记录积分使用
                const supabase = getSimpleDbClient();
                await supabase
                    .from('credits')
                    .insert({
                        user_uuid: finalUserId,
                        trans_type: 'hairstyle',
                        trans_no: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
                        order_no: taskId,
                        credits: -10,
                        expired_at: null,
                        created_at: new Date().toISOString(),
                        event_type: 'hairstyle_usage'
                    });
                
                console.log(`✅ Credits deducted: ${userCredits} -> ${newCredits} for user ${finalUserId}`);
            } catch (error) {
                console.error('Error deducting credits:', error);
                // 不影响主流程，但记录错误
            }
        } else {
            // 更新免费用户的请求计数
            if (!isLocalDev && !isWhitelistIP) {
                const currentCount = requestCounts.get(ip);
                if (currentCount && currentCount.date === today) {
                    currentCount.count += 1;
                } else {
                    requestCounts.set(ip, { count: 1, date: today });
                }
            }
        }

        return NextResponse.json({
            success: true,
            taskId: taskId,
            message: 'Hairstyle generation started successfully',
            creditsUsed: hasActiveSubscription ? 10 : 0,
            remainingCredits: hasActiveSubscription ? userCredits - 10 : null
        });

    } catch (error) {
        console.error('Error in POST request:', error);
        return NextResponse.json({
            success: false,
            error: 'An unexpected error occurred',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// 性别检测函数
async function detectGender(imageBuffer: Buffer): Promise<'male' | 'female'> {
    // 简化的性别检测逻辑
    // 实际应用中可以使用更复杂的 AI 模型
    return 'female'; // 默认返回女性
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
        return NextResponse.json({
            success: false,
            error: 'Task ID is required'
        }, { status: 400 });
    }

    try {
        const response = await client.get(`${API_BASE_URL}/common/query-async-task-result/${taskId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (response.status !== 200) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch task result',
                debug: response.data
            }, { status: response.status });
        }

        const result = response.data as TaskResult;
        
        // 如果任务完成，检查结果
        if (result.status === 'completed' && result.result) {
            // 🔥 使用简化方式验证用户（可选）
            const userId = extractUserIdFromRequest(req);
            if (userId) {
                const validation = await validateUserId(userId);
                if (validation.valid) {
                    const userCredits = await getUserCredits(userId);
                    console.log(`Task ${taskId} completed for user ${userId}, remaining credits: ${userCredits}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            ...(result || {})
        });

    } catch (error) {
        console.error('Error fetching task result:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch task result',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 