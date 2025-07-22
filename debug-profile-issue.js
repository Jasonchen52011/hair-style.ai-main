// 诊断用户登录和profile表问题的脚本

const { createClient } = require('@supabase/supabase-js');

// 创建Supabase客户端
const supabase = createClient(
  'https://tnolrawxpimpxcplyvwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20'
);

async function diagnoseProfileIssue() {
  console.log('=== 诊断用户登录和Profile表问题 ===\n');
  
  try {
    // 1. 检查当前登录用户状态
    console.log('1. 检查认证状态...');
    const response = await fetch('http://localhost:3000/api/check-user');
    const authData = await response.json();
    
    console.log('认证状态:', authData.isLoggedIn ? '✅ 已登录' : '❌ 未登录');
    
    if (!authData.isLoggedIn) {
      console.log('\n⚠️  需要先登录才能继续诊断');
      console.log('请在浏览器中访问: http://localhost:3000/signin');
      console.log('登录后再运行此脚本');
      return;
    }
    
    const userId = authData.user.id;
    const userEmail = authData.user.email;
    console.log('用户ID:', userId);
    console.log('用户邮箱:', userEmail);
    
    // 2. 检查auth.users表
    console.log('\n2. 检查Supabase Auth用户...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user) {
      console.log('✅ 在auth.users表中找到用户');
      console.log('- 创建时间:', authUser.user.created_at);
      console.log('- 元数据:', JSON.stringify(authUser.user.user_metadata, null, 2));
    } else {
      console.log('❌ 在auth.users表中未找到用户');
    }
    
    // 3. 检查profiles表
    console.log('\n3. 检查profiles表...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profile) {
      console.log('✅ 在profiles表中找到用户');
      console.log('- Email:', profile.email);
      console.log('- Name:', profile.name);
      console.log('- Created:', profile.created_at);
      console.log('- 积分:', profile.current_credits);
    } else {
      console.log('❌ 在profiles表中未找到用户');
      console.log('错误:', profileError?.message);
    }
    
    // 4. 检查users表（Drizzle）
    console.log('\n4. 检查users表（自定义）...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('uuid', userId)
      .single();
      
    if (user) {
      console.log('✅ 在users表中找到用户');
      console.log('- Email:', user.email);
      console.log('- Nickname:', user.nickname);
      console.log('- Created:', user.created_at);
    } else {
      console.log('❌ 在users表中未找到用户');
      console.log('错误:', userError?.message);
      
      // 尝试通过邮箱查找
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();
        
      if (userByEmail) {
        console.log('⚠️  通过邮箱找到用户，但UUID不匹配:');
        console.log('- 数据库UUID:', userByEmail.uuid);
        console.log('- 当前UUID:', userId);
      }
    }
    
    // 5. 检查积分余额
    console.log('\n5. 检查积分余额...');
    const { data: balance, error: balanceError } = await supabase
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', userId)
      .single();
      
    if (balance) {
      console.log('✅ 找到积分余额:', balance.balance);
    } else {
      console.log('❌ 未找到积分余额记录');
      console.log('错误:', balanceError?.message);
    }
    
    // 6. 提供修复建议
    console.log('\n6. 修复建议...');
    
    if (!profile && authUser?.user) {
      console.log('\n🔧 建议1: 创建missing的profile记录');
      await createMissingProfile(authUser.user);
    }
    
    if (!user && authUser?.user) {
      console.log('\n🔧 建议2: 创建missing的users表记录');
      await createMissingUser(authUser.user);
    }
    
    if (!balance && authUser?.user) {
      console.log('\n🔧 建议3: 创建初始积分余额记录');
      await createMissingCreditsBalance(userId);
    }
    
  } catch (error) {
    console.error('诊断过程中出错:', error);
  }
}

async function createMissingProfile(authUser) {
  try {
    const userData = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      image: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
      has_access: false,
      current_credits: 0,
      created_at: authUser.created_at,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([userData])
      .select();
      
    if (error) {
      console.log('❌ 创建profile失败:', error.message);
    } else {
      console.log('✅ 成功创建profile记录');
    }
  } catch (error) {
    console.log('❌ 创建profile时出错:', error.message);
  }
}

async function createMissingUser(authUser) {
  try {
    const userData = {
      uuid: authUser.id,
      email: authUser.email,
      nickname: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
      signin_type: 'oauth',
      signin_provider: 'google',
      signin_openid: authUser.id,
      created_at: authUser.created_at,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();
      
    if (error) {
      console.log('❌ 创建users记录失败:', error.message);
    } else {
      console.log('✅ 成功创建users记录');
    }
  } catch (error) {
    console.log('❌ 创建users记录时出错:', error.message);
  }
}

async function createMissingCreditsBalance(userId) {
  try {
    const { data, error } = await supabase
      .from('user_credits_balance')
      .insert([{
        user_uuid: userId,
        balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
      
    if (error) {
      console.log('❌ 创建积分余额失败:', error.message);
    } else {
      console.log('✅ 成功创建积分余额记录');
    }
  } catch (error) {
    console.log('❌ 创建积分余额时出错:', error.message);
  }
}

// 运行诊断
diagnoseProfileIssue().then(() => {
  console.log('\n=== 诊断完成 ===');
}).catch(error => {
  console.error('脚本执行失败:', error);
}); 