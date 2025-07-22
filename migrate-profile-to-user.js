// 将profile表的数据迁移到users表

const { createClient } = require('@supabase/supabase-js');

// 创建Supabase客户端
const supabase = createClient(
  'https://tnolrawxpimpxcplyvwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20'
);

async function migrateProfileToUser() {
  try {
    console.log('Starting profile to user migration...\n');
    
    // 1. 获取当前登录用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // 如果没有通过浏览器登录，尝试获取所有profiles
      console.log('Getting all profiles from database...');
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }
      
      console.log(`Found ${profiles?.length || 0} profiles`);
      
      // 为每个profile创建对应的user记录
      for (const profile of profiles || []) {
        await createUserFromProfile(profile);
      }
    } else {
      // 只处理当前用户
      console.log('Processing current user:', user.email);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (profile) {
        await createUserFromProfile(profile);
      }
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

async function createUserFromProfile(profile) {
  try {
    console.log(`\nProcessing profile for: ${profile.email}`);
    
    // 检查user是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', profile.email)
      .single();
      
    if (existingUser) {
      console.log(`✅ User already exists for ${profile.email}`);
      return;
    }
    
    // 创建新的user记录
    const userData = {
      uuid: profile.id,
      email: profile.email,
      nickname: profile.name || '',
      avatar_url: profile.image || '',
      signin_type: 'oauth',
      signin_provider: 'google',
      signin_openid: profile.id,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select();
      
    if (insertError) {
      console.error(`❌ Error creating user for ${profile.email}:`, insertError);
    } else {
      console.log(`✅ Created user for ${profile.email}`);
      
      // 创建初始积分余额
      const { error: balanceError } = await supabase
        .from('user_credits_balance')
        .insert([{
          user_uuid: profile.id,
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (balanceError && !balanceError.message.includes('duplicate')) {
        console.error('Error creating credits balance:', balanceError);
      } else {
        console.log('✅ Created initial credits balance');
      }
    }
    
  } catch (error) {
    console.error('Error processing profile:', error);
  }
}

// 运行迁移
migrateProfileToUser();