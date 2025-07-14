import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// 创建管理员客户端（绕过RLS）
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
    // 检查用户是否存在于 profiles 表中
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      return { valid: false, error: 'User not found' };
    }

    if (profileError) {
      return { valid: false, error: `Database error: ${profileError.message}` };
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
  return adminSupabase;
}

/**
 * 简化的用户数据获取函数
 */
export async function getUserProfile(userId: string) {
  const { data: profile, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return profile;
}

/**
 * 简化的用户积分获取函数
 */
export async function getUserCredits(userId: string): Promise<number> {
  const { data: profile, error } = await adminSupabase
    .from('profiles')
    .select('current_credits')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user credits: ${error.message}`);
  }

  return profile?.current_credits || 0;
}

/**
 * 简化的积分更新函数
 */
export async function updateUserCredits(userId: string, credits: number) {
  const { error } = await adminSupabase
    .from('profiles')
    .update({
      current_credits: credits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user credits: ${error.message}`);
  }
}

/**
 * 简化的订阅检查函数
 */
export async function checkActiveSubscription(userId: string): Promise<boolean> {
  const { data: subscriptions, error } = await adminSupabase
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