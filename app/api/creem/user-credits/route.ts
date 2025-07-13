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
        // 从auth获取用户ID
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
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
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not authenticated" 
      }, { status: 401 });
    }
    
    const cacheKey = getCacheKey(user.id);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('current_credits')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch user credits' 
        },
        { status: 500 }
      );
    }
    
    const result = { 
      success: true,
      credits: profile?.current_credits || 0,
      user_id: user.id
    };
    
    setCachedData(cacheKey, result);
    
    return NextResponse.json(result);

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
    const { action, amount, trans_type = TRANS_TYPE.HAIRSTYLE, order_no } = await request.json();
    
    // 使用正确的 Supabase Auth Helpers
    const supabase = createRouteHandlerClient({ cookies });
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    if (action === 'consume' && amount > 0) {
      // 使用管理员客户端从profiles表中获取用户当前积分
      const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('current_credits')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return NextResponse.json(
          { message: "Failed to fetch user profile" },
          { status: 500 }
        );
      }

      // 直接使用current_credits字段
      const currentCredits = profile?.current_credits || 0;
      
      if (currentCredits < amount) {
        return NextResponse.json(
          { message: "Insufficient credits" },
          { status: 400 }
        );
      }

      // 生成交易编号
      const transactionNo = generateTransactionNo();

      // 使用事务同时更新两个表
      const { error: transactionError } = await adminSupabase.rpc('consume_credits', {
        user_id: user.id,
        amount: amount,
        trans_type: trans_type,
        trans_no: transactionNo,
        order_no: order_no || null,
        event_type: 'credit_consumption'
      });

      if (transactionError) {
        console.error("Error consuming credits:", transactionError);
        
        // 如果RPC函数不存在，回退到手动更新
        const [insertResult, updateResult] = await Promise.all([
          adminSupabase
            .from('credits')
            .insert({
              user_uuid: user.id,
              trans_type: trans_type,
              trans_no: transactionNo,
              order_no: order_no || null,
              credits: -amount, // 负数表示消费
              expired_at: null,
              created_at: new Date().toISOString(),
              event_type: 'credit_consumption'
            }),
          adminSupabase
            .from('profiles')
            .update({
              current_credits: currentCredits - amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
        ]);

        if (insertResult.error) {
          console.error("Error recording credit consumption:", insertResult.error);
          return NextResponse.json(
            { message: "Failed to record credit consumption" },
            { status: 500 }
          );
        }

        if (updateResult.error) {
          console.error("Error updating profile credits:", updateResult.error);
          return NextResponse.json(
            { message: "Failed to update profile credits" },
            { status: 500 }
          );
        }
      }

      // 清除用户缓存
      clearUserCache(user.id);

      return NextResponse.json({
        message: "Credits consumed successfully",
        remainingCredits: currentCredits - amount,
        transactionNo: transactionNo
      });
    }

    if (action === 'add' && amount > 0) {
      // 获取当前积分
      const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('current_credits')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return NextResponse.json(
          { message: "Failed to fetch user profile" },
          { status: 500 }
        );
      }

      const currentCredits = profile?.current_credits || 0;
      const transactionNo = generateTransactionNo();

      // 使用事务同时更新两个表
      const { error: transactionError } = await adminSupabase.rpc('add_credits', {
        user_id: user.id,
        amount: amount,
        trans_type: trans_type,
        trans_no: transactionNo,
        order_no: order_no || null,
        event_type: 'manual_addition'
      });

      if (transactionError) {
        console.error("Error adding credits:", transactionError);
        
        // 如果RPC函数不存在，回退到手动更新
        const [insertResult, updateResult] = await Promise.all([
          adminSupabase
            .from('credits')
            .insert({
              user_uuid: user.id,
              trans_type: trans_type,
              trans_no: transactionNo,
              order_no: order_no || null,
              credits: amount, // 正数表示获得
              expired_at: null, // 手动添加的积分默认不过期
              created_at: new Date().toISOString(),
              event_type: 'manual_addition'
            }),
          adminSupabase
            .from('profiles')
            .update({
              current_credits: currentCredits + amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
        ]);

        if (insertResult.error) {
          console.error("Error recording credit addition:", insertResult.error);
          return NextResponse.json(
            { message: "Failed to record credit addition" },
            { status: 500 }
          );
        }

        if (updateResult.error) {
          console.error("Error updating profile credits:", updateResult.error);
          return NextResponse.json(
            { message: "Failed to update profile credits" },
            { status: 500 }
          );
        }
      }

      // 清除用户缓存
      clearUserCache(user.id);

      return NextResponse.json({
        message: "Credits added successfully",
        totalCredits: Math.max(0, currentCredits + amount),
        transactionNo: transactionNo
      });
    }

    return NextResponse.json(
      { message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing credit transaction:", error);
    return NextResponse.json(
      { message: "Failed to process credit transaction" },
      { status: 500 }
    );
  }
}
