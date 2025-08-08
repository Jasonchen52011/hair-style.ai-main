const { createClient } = require('@supabase/supabase-js');

// 新项目配置
const NEW_SUPABASE_URL = 'https://tnolrawxpimpxcplyvwt.supabase.co';
const NEW_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20';

// 旧项目配置
const OLD_SUPABASE_URL = 'https://hvpszymmfsbslncfbqdf.supabase.co';
const OLD_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cHN6eW1tZnNic2xuY2ZicWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk5NTk3NCwiZXhwIjoyMDY3NTcxOTc0fQ.--u_8qCd2mQ-GkCRZpdfmfAy544xGX1eCRwtrJgWesw';

const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_KEY);

async function checkProfilesData() {
  console.log('🔍 检查 profiles 表数据...\n');
  
  try {
    // 1. 检查新数据库的 profiles
    console.log('1️⃣ 新数据库 (tnolrawxpimpxcplyvwt):');
    const { data: newProfiles, error: newError, count: newCount } = await newSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: false });
    
    if (newError) {
      console.error('查询新数据库失败:', newError);
    } else {
      console.log(`✅ 找到 ${newCount || newProfiles?.length || 0} 条记录`);
      if (newProfiles && newProfiles.length > 0) {
        console.log('现有的 profiles:');
        newProfiles.forEach(profile => {
          console.log(`  - ${profile.id}: ${profile.email}`);
        });
      }
    }
    
    // 2. 检查旧数据库的 profiles
    console.log('\n2️⃣ 旧数据库 (hvpszymmfsbslncfbqdf):');
    const { data: oldProfiles, error: oldError, count: oldCount } = await oldSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: false });
    
    if (oldError) {
      console.error('查询旧数据库失败:', oldError);
    } else {
      console.log(`✅ 找到 ${oldCount || oldProfiles?.length || 0} 条记录`);
      if (oldProfiles && oldProfiles.length > 0) {
        console.log(`显示前 10 条记录:`);
        oldProfiles.slice(0, 10).forEach(profile => {
          console.log(`  - ${profile.id}: ${profile.email}`);
        });
      }
    }
    
    // 3. 检查 auth.users 表
    console.log('\n3️⃣ 检查新数据库的 auth.users:');
    const { data: authUsers, error: authError } = await newSupabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('查询 auth.users 失败:', authError);
    } else {
      console.log(`✅ auth.users 中有 ${authUsers.users?.length || 0} 个用户`);
      if (authUsers.users && authUsers.users.length > 0) {
        console.log('前 5 个用户:');
        authUsers.users.slice(0, 5).forEach(user => {
          console.log(`  - ${user.id}: ${user.email}`);
        });
      }
    }
    
    // 4. 对比分析
    console.log('\n4️⃣ 数据对比分析:');
    console.log('============================================');
    console.log(`旧数据库 profiles: ${oldCount || oldProfiles?.length || 0} 条`);
    console.log(`新数据库 profiles: ${newCount || newProfiles?.length || 0} 条`);
    console.log(`新数据库 auth.users: ${authUsers?.users?.length || 0} 条`);
    console.log('============================================');
    
    if ((newCount || 0) < (oldCount || 0)) {
      console.log('\n⚠️ 警告: 新数据库的 profiles 数量少于旧数据库！');
      console.log('可能原因:');
      console.log('1. 数据迁移不完整');
      console.log('2. 删除了部分数据');
      console.log('3. 使用了不同的数据库');
      
      console.log('\n建议采取的措施:');
      console.log('1. 从旧数据库导出所有 profiles 数据');
      console.log('2. 检查是否有数据迁移脚本');
      console.log('3. 考虑重新迁移数据');
    }
    
    // 5. 检查是否需要迁移数据
    if (oldProfiles && oldProfiles.length > 0 && newProfiles && newProfiles.length < oldProfiles.length) {
      console.log('\n5️⃣ 检查缺失的数据:');
      const newProfileIds = new Set(newProfiles.map(p => p.id));
      const missingProfiles = oldProfiles.filter(p => !newProfileIds.has(p.id));
      
      console.log(`发现 ${missingProfiles.length} 条缺失的记录`);
      if (missingProfiles.length > 0) {
        console.log('缺失的前 10 条记录:');
        missingProfiles.slice(0, 10).forEach(profile => {
          console.log(`  - ${profile.id}: ${profile.email}`);
        });
      }
    }
    
  } catch (error) {
    console.error('检查过程出错:', error);
  }
}

// 运行检查
checkProfilesData().then(() => {
  console.log('\n✅ 检查完成');
  process.exit(0);
}).catch(err => {
  console.error('检查失败:', err);
  process.exit(1);
});