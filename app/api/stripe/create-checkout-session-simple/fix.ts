// 在创建订单前，确保用户有 profile
export async function ensureUserProfile(userId: string, email: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 检查 profile 是否存在
  const { data: profile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!profile) {
    // 创建 profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_access: true
      });

    if (insertError) {
      console.error('Failed to create profile:', insertError);
      throw insertError;
    }
    
    console.log('Profile created for user:', userId);
  }
  
  return true;
}

// 在 create-checkout-session-simple/route.ts 中调用：
// await ensureUserProfile(user.id, user.email);