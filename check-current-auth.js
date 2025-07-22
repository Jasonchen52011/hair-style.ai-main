// 检查当前认证状态

async function checkCurrentAuth() {
  try {
    console.log('=== 检查当前认证状态 ===\n');
    
    // 1. 检查Supabase Auth
    console.log('1. 通过API检查用户状态...');
    const response = await fetch('http://localhost:3000/api/check-user');
    const data = await response.json();
    
    console.log('API响应:', JSON.stringify(data, null, 2));
    
    if (data.isLoggedIn && data.user) {
      const userId = data.user.id;
      console.log('\n✅ 用户已登录，ID:', userId);
      
      // 2. 检查数据库中的记录
      console.log('\n2. 检查数据库记录...');
      
      // 使用 Supabase client 直接查询
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://tnolrawxpimpxcplyvwt.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20'
      );
      
      // 检查 profiles 表
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profile) {
        console.log('\n✅ 在profiles表找到用户:');
        console.log('- Email:', profile.email);
        console.log('- Name:', profile.name);
        console.log('- Credits:', profile.current_credits);
      } else {
        console.log('\n❌ 在profiles表未找到用户');
      }
      
      // 检查 users 表
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', userId)
        .single();
        
      if (user) {
        console.log('\n✅ 在users表找到用户:');
        console.log('- Email:', user.email);
        console.log('- Nickname:', user.nickname);
        console.log('- Created:', user.created_at);
      } else {
        console.log('\n❌ 在users表未找到用户');
        
        // 尝试用email查找
        const { data: userByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single();
          
        if (userByEmail) {
          console.log('\n⚠️  通过email找到用户，但UUID不匹配:');
          console.log('- 数据库UUID:', userByEmail.uuid);
          console.log('- 当前UUID:', userId);
        }
      }
      
      // 检查积分余额
      const { data: balance } = await supabase
        .from('user_credits_balance')
        .select('*')
        .eq('user_uuid', userId)
        .single();
        
      if (balance) {
        console.log('\n✅ 积分余额:', balance.balance);
      } else {
        console.log('\n❌ 未找到积分余额记录');
      }
      
    } else {
      console.log('\n❌ 用户未登录');
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkCurrentAuth();