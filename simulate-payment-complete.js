// 模拟支付完成流程

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tnolrawxpimpxcplyvwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20'
);

async function simulatePaymentComplete() {
  try {
    console.log('模拟支付完成流程...\n');
    
    // 1. 获取最新的created状态订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'created')
      .eq('user_uuid', 'b2ddd643-5f50-44f0-8cac-af6b981df596')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (ordersError || !orders || orders.length === 0) {
      console.error('没有找到待支付订单');
      return;
    }
    
    const order = orders[0];
    console.log('找到订单:', order.order_no);
    console.log('积分数量:', order.credits);
    
    // 2. 更新订单状态为已支付
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_email: order.user_email,
        paid_detail: JSON.stringify({ simulated: true })
      })
      .eq('order_no', order.order_no);
      
    if (updateError) {
      console.error('更新订单失败:', updateError);
      return;
    }
    
    console.log('✅ 订单状态已更新为paid');
    
    // 3. 添加积分到用户余额
    const { data: currentBalance } = await supabase
      .from('user_credits_balance')
      .select('balance')
      .eq('user_uuid', order.user_uuid)
      .single();
      
    const oldBalance = currentBalance?.balance || 0;
    const newBalance = oldBalance + order.credits;
    
    const { error: balanceError } = await supabase
      .from('user_credits_balance')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_uuid', order.user_uuid);
      
    if (balanceError) {
      console.error('更新余额失败:', balanceError);
      return;
    }
    
    console.log(`✅ 积分余额已更新: ${oldBalance} -> ${newBalance}`);
    
    // 4. 创建积分交易记录
    const { error: creditError } = await supabase
      .from('credits')
      .insert({
        trans_no: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        created_at: new Date().toISOString(),
        user_uuid: order.user_uuid,
        trans_type: 'purchase',
        credits: order.credits,
        order_no: order.order_no
      });
      
    if (creditError) {
      console.error('创建积分记录失败:', creditError);
    } else {
      console.log('✅ 积分交易记录已创建');
    }
    
    console.log('\n✅ 支付模拟完成！请刷新页面查看积分。');
    
  } catch (error) {
    console.error('模拟失败:', error);
  }
}

simulatePaymentComplete();