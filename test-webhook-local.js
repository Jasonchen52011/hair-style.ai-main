// 测试 webhook 处理逻辑
const { createClient } = require('@supabase/supabase-js');

// 直接使用环境变量值
const SUPABASE_URL = 'https://tnolrawxpimpxcplyvwt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testWebhookLogic() {
  console.log('🔍 测试 Webhook 处理逻辑...\n');
  
  // 模拟 webhook 数据
  const session = {
    id: 'cs_test_' + Date.now(),
    metadata: {
      order_no: 'ORDER_1754490802634_5jzfnap',
      user_id: 'd8952a55-6c30-413a-b230-8d9304d880be',
      user_email: 'jasonchen520019@gmail.com',
      product_id: 'prod_SoOkvzK9C3gxpi',
      credits: '50'
    },
    customer_email: 'jasonchen520019@gmail.com'
  };
  
  try {
    console.log('1️⃣ 查找订单...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_no', session.metadata.order_no)
      .single();
    
    if (orderError) {
      console.error('❌ 查找订单失败:', orderError);
      return;
    }
    
    console.log('✅ 找到订单:', order.order_no);
    console.log('   状态:', order.status);
    console.log('   用户:', order.user_uuid);
    
    // 检查订单是否已处理
    if (order.status === 'paid') {
      console.log('⚠️ 订单已经是 paid 状态，跳过处理');
      return;
    }
    
    console.log('\n2️⃣ 更新订单状态...');
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_email: session.customer_email || order.user_email
      })
      .eq('order_no', session.metadata.order_no);
    
    if (updateError) {
      console.error('❌ 更新订单状态失败:', updateError);
      return;
    }
    console.log('✅ 订单状态已更新为 paid');
    
    console.log('\n3️⃣ 处理积分...');
    const credits = parseInt(session.metadata.credits || '0');
    console.log('   要添加的积分:', credits);
    
    if (credits > 0) {
      // 检查当前余额
      const { data: currentBalance, error: balanceError } = await supabase
        .from('user_credits_balance')
        .select('*')
        .eq('user_uuid', order.user_uuid)
        .single();
      
      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('❌ 查询余额失败:', balanceError);
        throw balanceError;
      }
      
      console.log('   当前余额:', currentBalance?.balance || 0);
      
      // 更新或创建余额记录
      if (currentBalance) {
        // 更新现有余额
        const newBalance = currentBalance.balance + credits;
        const { error: updateBalanceError } = await supabase
          .from('user_credits_balance')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_uuid', order.user_uuid);
        
        if (updateBalanceError) {
          console.error('❌ 更新余额失败:', updateBalanceError);
          throw updateBalanceError;
        }
        console.log('✅ 余额已更新:', currentBalance.balance, '->', newBalance);
      } else {
        // 创建新余额记录
        const { error: insertBalanceError } = await supabase
          .from('user_credits_balance')
          .insert({
            user_uuid: order.user_uuid,
            balance: credits,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertBalanceError) {
          console.error('❌ 创建余额记录失败:', insertBalanceError);
          throw insertBalanceError;
        }
        console.log('✅ 创建新余额记录:', credits);
      }
      
      // 创建积分交易记录
      const transactionNo = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: creditsError } = await supabase
        .from('credits')
        .insert([{
          trans_no: transactionNo,
          created_at: new Date().toISOString(),
          user_uuid: order.user_uuid,
          trans_type: 'purchase',
          credits: credits,
          order_no: session.metadata.order_no
        }]);
      
      if (creditsError) {
        console.error('❌ 创建积分记录失败:', creditsError);
        throw creditsError;
      }
      
      console.log('✅ 积分交易记录已创建:', transactionNo);
    }
    
    console.log('\n✅ Webhook 处理成功！');
    
  } catch (error) {
    console.error('\n❌ Webhook 处理失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
}

// 运行测试
testWebhookLogic().then(() => {
  console.log('\n测试完成');
  process.exit(0);
}).catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});