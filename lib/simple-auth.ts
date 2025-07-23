import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// 获取管理员客户端的函数
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * 简化的用户验证函数
 * 只需要验证 userid 即可，不需要完整的 JWT token 验证
 */
export async function validateUserId(userId: string): Promise<{ valid: boolean; error?: string }> {
  if (!userId) {
    return { valid: false, error: 'User ID is required' };
  }

  // 验证 UUID 格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return { valid: false, error: 'Invalid User ID format' };
  }

  try {
    // 检查用户是否存在于 users 表中
    const { data: user, error: userError } = await getAdminSupabase()
      .from('users')
      .select('uuid')
      .eq('uuid', userId)
      .single();

    if (userError && userError.code === 'PGRST116') {
      return { valid: false, error: 'User not found' };
    }

    if (userError) {
      return { valid: false, error: `Database error: ${userError.message}` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error}` };
  }
}

/**
 * 从请求中提取 userId
 * 支持多种方式：header、query
 */
export function extractUserId(request: NextRequest): string | null {
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

/**
 * 简化的数据库客户端，绕过 RLS 限制
 */
export function getSimpleDbClient() {
  return getAdminSupabase();
}

/**
 * 简化的用户数据获取函数
 */
export async function getUserProfile(userId: string) {
  const { data: user, error } = await getAdminSupabase()
    .from('users')
    .select('*')
    .eq('uuid', userId)
    .single();

  if (error) {
    // 如果在users表找不到，返回null而不是抛出错误
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  // 转换为profile格式以保持兼容性
  return {
    id: user.uuid,
    email: user.email,
    name: user.nickname,
    image: user.avatar_url,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

/**
 * 简化的用户积分获取函数
 */
export async function getUserCredits(userId: string): Promise<number> {
  const { data: balance, error } = await getAdminSupabase()
    .from('user_credits_balance')
    .select('balance')
    .eq('user_uuid', userId)
    .single();

  if (error) {
    // 如果没有记录，返回0
    if (error.code === 'PGRST116') {
      return 0;
    }
    throw new Error(`Failed to fetch user credits: ${error.message}`);
  }

  return balance?.balance || 0;
}

/**
 * 简化的积分更新函数
 */
export async function updateUserCredits(userId: string, credits: number) {
  // 先检查是否存在记录
  const { data: existing } = await getAdminSupabase()
    .from('user_credits_balance')
    .select('id')
    .eq('user_uuid', userId)
    .single();

  if (existing) {
    // 更新现有记录
    const { error } = await getAdminSupabase()
      .from('user_credits_balance')
      .update({
        balance: credits,
        updated_at: new Date().toISOString()
      })
      .eq('user_uuid', userId);

    if (error) {
      throw new Error(`Failed to update user credits: ${error.message}`);
    }
  } else {
    // 创建新记录
    const { error } = await getAdminSupabase()
      .from('user_credits_balance')
      .insert({
        user_uuid: userId,
        balance: credits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to create user credits balance: ${error.message}`);
    }
  }
}

/**
 * 简化的订阅检查函数
 */
export async function checkActiveSubscription(userId: string): Promise<boolean> {
  const { data: subscriptions, error } = await getAdminSupabase()
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString());

  if (error) {
    throw new Error(`Failed to check subscription: ${error.message}`);
  }

  return subscriptions && subscriptions.length > 0;
} 