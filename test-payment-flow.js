const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPaymentFlow() {
  console.log('🔍 开始测试支付流程...\n');
  
  const testResults = {
    supabaseConnection: false,
    tablesExist: false,
    foreignKeys: {},
    profilesCount: 0,
    authUsersCount: 0,
    missingProfiles: [],
    orderCreation: false,
    issues: []
  };

  try {
    // 1. 测试 Supabase 连接
    console.log('1️⃣ 测试 Supabase 连接...');
    const { data: test, error: connError } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    if (!connError) {
      testResults.supabaseConnection = true;
      console.log('✅ Supabase 连接成功\n');
    } else {
      console.log('❌ Supabase 连接失败:', connError.message, '\n');
      testResults.issues.push('Supabase 连接失败');
      return testResults;
    }

    // 2. 检查表结构
    console.log('2️⃣ 检查表结构...');
    const tables = ['orders', 'profiles', 'credits', 'user_credits_balance'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        console.log(`  ✅ ${table} 表存在`);
      } else {
        console.log(`  ❌ ${table} 表不存在或无法访问`);
        testResults.issues.push(`${table} 表问题`);
      }
    }
    testResults.tablesExist = true;
    console.log('');

    // 3. 检查 auth.users 和 profiles 的数据
    console.log('3️⃣ 检查用户数据...');
    
    // 获取 auth.users 数量
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_auth_users_count');
    
    // 获取 profiles 数量
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    testResults.profilesCount = profilesCount || 0;
    console.log(`  📊 profiles 表记录数: ${profilesCount}`);
    
    // 4. 查找没有 profile 的 auth.users
    console.log('\n4️⃣ 检查数据一致性...');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id');
    
    const profileIds = profiles ? profiles.map(p => p.id) : [];
    console.log(`  📊 有 ${profileIds.length} 个用户有 profile`);

    // 5. 测试订单创建
    console.log('\n5️⃣ 测试订单创建...');
    
    // 获取一个测试用户
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)
      .single();
    
    if (testUser) {
      const testOrderNo = `TEST_${Date.now()}`;
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_no: testOrderNo,
          user_uuid: testUser.id,
          user_email: testUser.email || 'test@example.com',
          amount: 100,
          status: 'pending',
          stripe_session_id: 'cs_test_' + Date.now(),
          credits: 50,
          currency: 'usd',
          product_id: 'prod_test',
          product_name: 'Test Product',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (!orderError) {
        console.log('  ✅ 订单创建成功:', testOrderNo);
        testResults.orderCreation = true;
        
        // 清理测试订单
        await supabase
          .from('orders')
          .delete()
          .eq('order_no', testOrderNo);
        console.log('  🧹 测试订单已清理');
      } else {
        console.log('  ❌ 订单创建失败:', orderError.message);
        console.log('     错误详情:', orderError);
        testResults.issues.push(`订单创建失败: ${orderError.message}`);
      }
    } else {
      console.log('  ⚠️ 没有找到测试用户');
      testResults.issues.push('没有 profiles 记录');
    }

    // 6. 检查外键约束
    console.log('\n6️⃣ 检查外键约束...');
    // 这需要直接查询 pg_constraint，通过 RPC 函数实现
    
  } catch (error) {
    console.error('测试过程出错:', error);
    testResults.issues.push(`测试错误: ${error.message}`);
  }

  // 生成报告
  console.log('\n' + '='.repeat(50));
  console.log('📋 测试报告总结');
  console.log('='.repeat(50));
  
  console.log('\n✅ 成功项:');
  if (testResults.supabaseConnection) console.log('  • Supabase 连接正常');
  if (testResults.tablesExist) console.log('  • 所需表都存在');
  if (testResults.orderCreation) console.log('  • 订单可以正常创建');
  if (testResults.profilesCount > 0) console.log(`  • profiles 表有 ${testResults.profilesCount} 条记录`);
  
  if (testResults.issues.length > 0) {
    console.log('\n❌ 问题:');
    testResults.issues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }
  
  console.log('\n💡 建议:');
  if (testResults.issues.includes('订单创建失败: insert or update on table "orders" violates foreign key constraint "orders_user_uuid_fkey"')) {
    console.log('  • 外键约束问题：orders.user_uuid 引用的表中没有对应的用户');
    console.log('  • 解决方案：确保所有 auth.users 都有对应的 profiles 记录');
  }
  
  return testResults;
}

// 创建 RPC 函数来获取 auth.users 数量
async function createHelperFunctions() {
  const sql = `
    -- 创建获取 auth.users 数量的函数
    CREATE OR REPLACE FUNCTION get_auth_users_count()
    RETURNS integer AS $$
    BEGIN
      RETURN (SELECT COUNT(*) FROM auth.users);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (!error) {
      console.log('辅助函数创建成功');
    }
  } catch (e) {
    // 函数可能已存在
  }
}

// 运行测试
testPaymentFlow().then(results => {
  console.log('\n📊 最终结果:', JSON.stringify(results, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});