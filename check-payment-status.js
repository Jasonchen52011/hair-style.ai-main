// 检查支付和订单状态

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tnolrawxpimpxcplyvwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20'
);

async function checkPaymentStatus() {
  try {
    console.log('=== 检查支付和订单状态 ===\n');
    
    // 1. 检查orders表
    console.log('1. 检查orders表...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    } else {
      console.log(`找到 ${orders?.length || 0} 个订单:`);
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          console.log(`\n订单号: ${order.order_no}`);
          console.log(`状态: ${order.status}`);
          console.log(`金额: $${order.amount / 100}`);
          console.log(`积分: ${order.credits}`);
          console.log(`用户: ${order.user_email}`);
          console.log(`创建时间: ${order.created_at}`);
          console.log(`Stripe Session ID: ${order.stripe_session_id || 'N/A'}`);
        });
      }
    }
    
    // 2. 检查credits表
    console.log('\n\n2. 检查credits表...');
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
    } else {
      console.log(`找到 ${credits?.length || 0} 条积分记录:`);
      if (credits && credits.length > 0) {
        credits.forEach(credit => {
          console.log(`\n交易号: ${credit.trans_no}`);
          console.log(`积分变动: ${credit.credits > 0 ? '+' : ''}${credit.credits}`);
          console.log(`类型: ${credit.trans_type}`);
          console.log(`订单号: ${credit.order_no || 'N/A'}`);
          console.log(`创建时间: ${credit.created_at}`);
        });
      }
    }
    
    // 3. 检查user_credits_balance表
    console.log('\n\n3. 检查user_credits_balance表...');
    const { data: balances, error: balanceError } = await supabase
      .from('user_credits_balance')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
      
    if (balanceError) {
      console.error('Error fetching balances:', balanceError);
    } else {
      console.log(`找到 ${balances?.length || 0} 个用户余额:`);
      if (balances && balances.length > 0) {
        balances.forEach(balance => {
          console.log(`\n用户ID: ${balance.user_uuid}`);
          console.log(`当前余额: ${balance.balance} 积分`);
          console.log(`更新时间: ${balance.updated_at}`);
        });
      }
    }
    
    // 4. 检查最近的用户
    console.log('\n\n4. 检查最近的用户...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('uuid, email, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log(`最近的用户:`);
      users?.forEach(user => {
        console.log(`- ${user.email} (${user.uuid})`);
      });
    }
    
  } catch (error) {
    console.error('检查错误:', error);
  }
}

checkPaymentStatus();