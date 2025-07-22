import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function findOrderByOrderNoSupabase(orderNo: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error finding order:", error);
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error finding order:", error);
    throw error;
  }
}

export async function updateOrderStatusSupabase(
  orderNo: string,
  status: string,
  paidAt: string,
  paidEmail: string,
  paidDetail?: string
) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: status,
        paid_at: paidAt,
        paid_email: paidEmail,
        paid_detail: paidDetail || null
      })
      .eq('order_no', orderNo)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

export async function insertOrderSupabase(orderData: any) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting order:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error inserting order:", error);
    throw error;
  }
}