import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
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

export async function GET(request: NextRequest) {
  // 用于用户认证检查
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 获取当前用户（用于认证验证）
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    // 检查缓存
    const cacheKey = getCacheKey(user.id);
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // 使用单个查询获取所有需要的数据
    const [profileResult, subscriptionsResult, creditRecordsResult] = await Promise.all([
      adminSupabase
        .from('profiles')
        .select('id, email, name, image')
        .eq('id', user.id)
        .single(),
      adminSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString()),
      adminSupabase
        .from('credits')
        .select('credits')
        .eq('user_uuid', user.id)
        .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString())
    ]);

    // 处理错误
    if (subscriptionsResult.error) {
      console.error("Error fetching subscriptions:", subscriptionsResult.error);
      return NextResponse.json(
        { message: "Failed to fetch subscription data" },
        { status: 500 }
      );
    }

    if (creditRecordsResult.error) {
      console.error("Error fetching credits:", creditRecordsResult.error);
      return NextResponse.json(
        { message: "Failed to fetch credits data" },
        { status: 500 }
      );
    }

    // 计算总积分（正数表示获得，负数表示消费）
    const totalCredits = creditRecordsResult.data?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

    const responseData = {
      profile: profileResult.data || { id: user.id, email: user.email, name: null, image: null },
      credits: Math.max(0, totalCredits), // 确保不返回负数
      subscriptions: subscriptionsResult.data || [],
      hasActiveSubscription: subscriptionsResult.data && subscriptionsResult.data.length > 0
    };

    // 缓存结果
    setCachedData(cacheKey, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return NextResponse.json(
      { message: "Failed to fetch user credits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 用于用户认证检查
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { action, amount, trans_type = TRANS_TYPE.HAIRSTYLE, order_no } = await request.json();
    
    // 获取当前用户（用于认证验证）
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    if (action === 'consume' && amount > 0) {
      // 使用管理员客户端从credits表中获取用户当前积分
      const { data: creditRecords, error: creditsError } = await adminSupabase
        .from('credits')
        .select('credits')
        .eq('user_uuid', user.id)
        .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

      if (creditsError) {
        console.error("Error fetching user credits:", creditsError);
        return NextResponse.json(
          { message: "Failed to fetch user credits" },
          { status: 500 }
        );
      }

      // 计算当前总积分
      const currentCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;
      
      if (currentCredits < amount) {
        return NextResponse.json(
          { message: "Insufficient credits" },
          { status: 400 }
        );
      }

      // 生成交易编号
      const transactionNo = generateTransactionNo();

      // 使用管理员客户端在credits表中记录积分消费（负数）
      const { error: insertError } = await adminSupabase
        .from('credits')
        .insert({
          user_uuid: user.id,
          trans_type: trans_type,
          trans_no: transactionNo,
          order_no: order_no || null,
          credits: -amount, // 负数表示消费
          expired_at: null,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("Error recording credit consumption:", insertError);
        return NextResponse.json(
          { message: "Failed to consume credits" },
          { status: 500 }
        );
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
      // 添加积分（用于购买等场景）
      const transactionNo = generateTransactionNo();

      // 使用管理员客户端添加积分
      const { error: insertError } = await adminSupabase
        .from('credits')
        .insert({
          user_uuid: user.id,
          trans_type: trans_type,
          trans_no: transactionNo,
          order_no: order_no || null,
          credits: amount, // 正数表示获得
          expired_at: null, // 手动添加的积分默认不过期
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("Error adding credits:", insertError);
        return NextResponse.json(
          { message: "Failed to add credits" },
          { status: 500 }
        );
      }

      // 清除用户缓存
      clearUserCache(user.id);

      // 获取更新后的积分
      const { data: updatedCreditRecords } = await adminSupabase
        .from('credits')
        .select('credits')
        .eq('user_uuid', user.id)
        .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

      const updatedCredits = updatedCreditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

      return NextResponse.json({
        message: "Credits added successfully",
        totalCredits: Math.max(0, updatedCredits),
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
