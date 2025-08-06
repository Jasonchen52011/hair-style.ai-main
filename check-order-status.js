const { createClient } = require('@supabase/supabase-js');

// 直接使用环境变量值
const SUPABASE_URL = 'https://tnolrawxpimpxcplyvwt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkOrderAndCredits() {
  console.log('🔍 检查订单 ORDER_1754490802634_5jzfnap 的状态...\n');
  
  const orderNo = 'ORDER_1754490802634_5jzfnap';
  
  try {
    // 1. 查询订单详情
    console.log('1️⃣ 订单信息:');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();
    
    if (orderError) {
      console.error('查询订单失败:', orderError);
    } else {
      console.log('订单号:', order.order_no);
      console.log('用户ID:', order.user_uuid);
      console.log('用户邮箱:', order.user_email);
      console.log('订单状态:', order.status);
      console.log('积分数量:', order.credits);
      console.log('支付时间:', order.paid_at);
    }
    
    // 2. 查询用户的 profile 信息
    console.log('\n2️⃣ 用户 Profile 信息:');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.user_uuid)
      .single();
    
    if (profileError) {
      console.error('查询 profile 失败:', profileError);
    } else {
      console.log('Profile ID:', profile.id);
      console.log('Email:', profile.email);
    }
    
    // 3. 查询积分交易记录
    console.log('\n3️⃣ 积分交易记录:');
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .eq('order_no', orderNo);
    
    if (creditsError) {
      console.error('查询积分记录失败:', creditsError);
    } else if (credits && credits.length > 0) {
      console.log('找到积分记录:');
      credits.forEach(c => {
        console.log('  - 交易号:', c.trans_no);
        console.log('    积分数:', c.credits);
        console.log('    类型:', c.trans_type);
        console.log('    用户ID:', c.user_uuid);
      });
    } else {
      console.log('❌ 没有找到积分交易记录');
    }
    
    // 4. 查询用户积分余额
    console.log('\n4️⃣ 用户积分余额:');
    const { data: balance, error: balanceError } = await supabase
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', order.user_uuid)
      .single();
    
    if (balanceError) {
      if (balanceError.code === 'PGRST116') {
        console.log('❌ 用户没有积分余额记录');
      } else {
        console.error('查询余额失败:', balanceError);
      }
    } else {
      console.log('当前余额:', balance.balance);
      console.log('更新时间:', balance.updated_at);
    }
    
    // 5. 检查外键约束
    console.log('\n5️⃣ 测试直接插入积分:');
    const testTransNo = `TEST_${Date.now()}`;
    
    // 先尝试插入到 credits 表
    const { error: testCreditError } = await supabase
      .from('credits')
      .insert({
        trans_no: testTransNo,
        created_at: new Date().toISOString(),
        user_uuid: order.user_uuid,
        trans_type: 'test',
        credits: 1,
        order_no: 'TEST_ORDER'
      });
    
    if (testCreditError) {
      console.error('❌ 无法插入积分记录:');
      console.error('  错误代码:', testCreditError.code);
      console.error('  错误消息:', testCreditError.message);
      console.error('  详细信息:', testCreditError.details);
      console.error('  提示:', testCreditError.hint);
    } else {
      console.log('✅ 测试插入成功，正在清理...');
      // 清理测试数据
      await supabase
        .from('credits')
        .delete()
        .eq('trans_no', testTransNo);
    }
    
    // 6. 检查 auth.users 表
    console.log('\n6️⃣ 检查 auth.users 表:');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(order.user_uuid);
    
    if (authError) {
      console.error('查询 auth.users 失败:', authError);
    } else if (authUser) {
      console.log('✅ 用户在 auth.users 表中存在');
      console.log('Auth Email:', authUser.user.email);
    } else {
      console.log('❌ 用户在 auth.users 表中不存在');
    }
    
  } catch (error) {
    console.error('检查过程出错:', error);
  }
}

// 运行检查
checkOrderAndCredits().then(() => {
  console.log('\n✅ 检查完成');
  process.exit(0);
}).catch(err => {
  console.error('检查失败:', err);
  process.exit(1);
});