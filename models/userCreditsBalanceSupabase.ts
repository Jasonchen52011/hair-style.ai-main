import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserCreditsBalanceSupabase(userUuid: string) {
  try {
    const { data, error } = await supabase
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', userUuid)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error getting user credits balance:", error);
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error getting user credits balance:", error);
    throw error;
  }
}

export async function createOrUpdateUserCreditsBalanceSupabase(
  userUuid: string,
  creditsToAdd: number
) {
  try {
    // 先查询是否存在
    const existing = await getUserCreditsBalanceSupabase(userUuid);
    
    if (existing) {
      // 更新余额
      const { data, error } = await supabase
        .from('user_credits_balance')
        .update({
          balance: existing.balance + creditsToAdd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_uuid', userUuid)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // 创建新记录
      const { data, error } = await supabase
        .from('user_credits_balance')
        .insert({
          user_uuid: userUuid,
          balance: creditsToAdd,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error creating/updating user credits balance:", error);
    throw error;
  }
}