const { createClient } = require('@supabase/supabase-js');

// 直接使用环境变量值
const SUPABASE_URL = 'https://tnolrawxpimpxcplyvwt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20';

// 初始化 Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCreditsInsert() {
  console.log('🔍 开始测试积分插入功能...\n');
  
  try {
    // 1. 获取一个测试用户
    console.log('1️⃣ 获取测试用户...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (profileError) {
      console.error('❌ 获取用户失败:', profileError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ 没有找到任何用户');
      return;
    }
    
    const testUser = profiles[0];
    console.log('✅ 找到测试用户:', testUser.id);
    
    // 2. 测试直接插入 credits 表
    console.log('\n2️⃣ 测试插入 credits 表...');
    const testTransNo = `TEST_${Date.now()}`;
    const testOrderNo = `ORDER_TEST_${Date.now()}`;
    
    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .insert({
        trans_no: testTransNo,
        created_at: new Date().toISOString(),
        user_uuid: testUser.id,
        trans_type: 'purchase',
        credits: 100,
        order_no: testOrderNo,
      })
      .select();
    
    if (creditError) {
      console.error('❌ 插入 credits 失败:', creditError);
      console.error('   错误详情:', {
        message: creditError.message,
        details: creditError.details,
        hint: creditError.hint,
        code: creditError.code
      });
    } else {
      console.log('✅ credits 插入成功:', creditData);
      
      // 清理测试数据
      await supabase
        .from('credits')
        .delete()
        .eq('trans_no', testTransNo);
      console.log('🧹 已清理测试数据');
    }
    
    // 3. 测试 user_credits_balance 表
    console.log('\n3️⃣ 测试 user_credits_balance 表...');
    
    // 先查询当前余额
    const { data: balanceBefore, error: balanceError } = await supabase
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', testUser.id)
      .single();
    
    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ 查询余额失败:', balanceError);
    } else {
      console.log('📊 当前余额:', balanceBefore?.balance || 0);
    }
    
    // 测试插入或更新
    if (balanceBefore) {
      // 更新余额
      const { data: updatedBalance, error: updateError } = await supabase
        .from('user_credits_balance')
        .update({
          balance: balanceBefore.balance + 50,
          updated_at: new Date().toISOString(),
        })
        .eq('user_uuid', testUser.id)
        .select();
      
      if (updateError) {
        console.error('❌ 更新余额失败:', updateError);
      } else {
        console.log('✅ 余额更新成功:', updatedBalance);
        
        // 恢复原余额
        await supabase
          .from('user_credits_balance')
          .update({
            balance: balanceBefore.balance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_uuid', testUser.id);
        console.log('🧹 已恢复原余额');
      }
    } else {
      // 创建新余额记录
      const { data: newBalance, error: insertError } = await supabase
        .from('user_credits_balance')
        .insert({
          user_uuid: testUser.id,
          balance: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (insertError) {
        console.error('❌ 创建余额记录失败:', insertError);
        console.error('   错误详情:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
      } else {
        console.log('✅ 余额记录创建成功:', newBalance);
        
        // 清理测试数据
        await supabase
          .from('user_credits_balance')
          .delete()
          .eq('user_uuid', testUser.id);
        console.log('🧹 已清理测试数据');
      }
    }
    
    // 4. 检查 RLS 策略
    console.log('\n4️⃣ 检查 RLS 策略状态...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_rls_status');
    
    if (!tablesError && tables) {
      console.log('📋 RLS 策略状态:');
      tables.forEach(table => {
        if (table.tablename === 'credits' || table.tablename === 'user_credits_balance') {
          console.log(`  - ${table.tablename}: RLS ${table.rls_enabled ? '已启用' : '未启用'}`);
        }
      });
    }
    
  } catch (error) {
    console.error('测试过程出错:', error);
  }
}

// 创建辅助函数
async function createHelperFunctions() {
  const sql = `
    -- 获取表的 RLS 状态
    CREATE OR REPLACE FUNCTION get_table_rls_status()
    RETURNS TABLE(tablename text, rls_enabled boolean) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.relname::text as tablename,
        c.relrowsecurity as rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql });
  } catch (e) {
    // 函数可能已存在
  }
}

// 运行测试
createHelperFunctions().then(() => {
  testCreditsInsert().then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  }).catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
  });
});