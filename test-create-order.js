// 测试创建订单

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tnolrawxpimpxcplyvwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2xyYXd4cGltcHhjcGx5dnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4ODI3MywiZXhwIjoyMDY4NjY0MjczfQ.NaSy6k6GAyWljWAZdlXhzs-H5X_77Y10ferEtp1Pm20'
);

// 生成订单号
function getSnowId() {
  return 'TEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function testCreateOrder() {
  try {
    console.log('测试创建订单...\n');
    
    const orderData = {
      order_no: getSnowId(),
      created_at: new Date().toISOString(),
      user_uuid: 'b2ddd643-5f50-44f0-8cac-af6b981df596', // 您的用户ID
      user_email: 'chenhaoxiang520119@gmail.com',
      amount: 500, // $5.00 in cents
      interval: 'one-time',
      status: 'created',
      credits: 50,
      currency: 'usd',
      product_id: 'prod_SikhNUm5QhhQ7x',
      product_name: '50 Credits',
      stripe_session_id: 'cs_test_' + Date.now()
    };
    
    console.log('订单数据:', orderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();
      
    if (error) {
      console.error('创建订单失败:', error);
      console.error('错误详情:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ 成功创建订单:', data);
    }
    
    // 检查表结构
    console.log('\n检查orders表结构...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public');
      
    if (columnsError) {
      console.error('无法获取表结构:', columnsError);
    } else {
      console.log('orders表字段:');
      columns?.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('测试错误:', error);
  }
}

testCreateOrder();