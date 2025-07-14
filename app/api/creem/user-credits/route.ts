import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// 积分交易类型
const TRANS_TYPE = {
  HAIRSTYLE: 'hairstyle',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  BONUS: 'bonus'
} as const;

// 创建管理员客户端（绕过RLS）
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 内存缓存
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30秒缓存

// 缓存工具函数
function getCacheKey(userId: string): string {
  return `user_credits_${userId}`;
}

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// 清除用户缓存
function clearUserCache(userId: string) {
  cache.delete(getCacheKey(userId));
}

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

/**
 * GET - 检查特定订单的credits是否存在
 * Query params: 
 * - order_id: 订单ID
 * - user_id: 用户ID (可选，从auth获取)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');
    const user_id = searchParams.get('user_id');
    
    // 🔍 如果有order_id参数，检查特定订单的credits是否存在
    if (order_id) {
      // 获取用户信息
      let userId = user_id;
      
      if (!userId) {
        // 从auth获取用户ID - 临时使用管理员客户端绕过cookies问题
        try {
          const { data: { user }, error: userError } = await adminSupabase.auth.getUser();
          
          if (userError || !user) {
            return NextResponse.json(
              { 
                success: false, 
                exists: false,
                error: 'User not authenticated' 
              },
              { status: 401 }
            );
          }
          
          userId = user.id;
                 } catch (authError) {
           console.error('❌ Auth error:', authError);
           return NextResponse.json(
             { 
               success: false, 
               exists: false,
               error: 'Authentication failed' 
             },
             { status: 401 }
           );
         }
      }

      console.log(`🔍 Checking credits for order ${order_id}, user ${userId}`);

      // 1. 查找对应的积分记录
      const { data: creditRecords, error: creditError } = await adminSupabase
        .from('credits')
        .select('*')
        .eq('user_uuid', userId)
        .eq('order_no', order_id)
        .eq('trans_type', 'purchase');

      if (creditError) {
        console.error('❌ Error fetching credit records:', creditError);
        return NextResponse.json({
          success: false,
          exists: false,
          error: 'Failed to fetch credit records',
          details: creditError.message
        }, { status: 500 });
      }

      const exists = creditRecords && creditRecords.length > 0;
      const totalCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

      // 2. 查找对应的订单记录（额外验证）
      const { data: orderRecord, error: orderError } = await adminSupabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .eq('order_id', order_id)
        .single();

      if (orderError && orderError.code !== 'PGRST116') {
        console.error('❌ Error fetching order record:', orderError);
      }

      // 3. 查找对应的订阅记录（额外验证）
      const { data: subscriptionRecord, error: subscriptionError } = await adminSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .like('creem_subscription_id', `%${order_id}%`)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('❌ Error fetching subscription record:', subscriptionError);
      }

      if (exists) {
        console.log(`✅ Found ${creditRecords.length} credit record(s) for order ${order_id}, total: ${totalCredits} credits`);
      } else {
        console.log(`❌ No credit records found for order ${order_id}`);
      }

      return NextResponse.json({
        success: true,
        exists: exists,
        credits: creditRecords || [],
        totalCredits: totalCredits,
        order: orderRecord || null,
        subscription: subscriptionRecord || null,
        order_id: order_id,
        user_id: userId,
        summary: {
          creditRecordsCount: creditRecords?.length || 0,
          orderExists: !!orderRecord,
          subscriptionExists: !!subscriptionRecord,
          totalCreditsGranted: totalCredits
        }
      });
    }

    // 📊 原有的获取用户当前积分功能（当没有order_id参数时）
    // 暂时跳过认证检查，直接返回错误，因为这个endpoint主要用于order_id查询
    return NextResponse.json({ 
      success: false, 
      error: "This endpoint requires order_id parameter" 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in GET /api/creem/user-credits:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 暂时禁用POST方法，因为Next.js 15 cookies兼容性问题
    return NextResponse.json(
      { 
        success: false,
        message: "POST method temporarily disabled due to Next.js 15 cookies compatibility issues",
        note: "Please use alternative endpoints for credit operations"
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Error in POST /api/creem/user-credits:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to process request",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
