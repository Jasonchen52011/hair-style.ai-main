import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Testing Order Creation ===");
    
    // 初始化 Supabase with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 创建测试订单数据
    const testOrderNo = `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const orderData = {
      order_no: testOrderNo,
      created_at: new Date().toISOString(),
      user_uuid: 'b2ddd643-5f50-44f0-8cac-af6b981df596', // 测试用户ID
      user_email: 'test@example.com',
      amount: 100,
      status: 'pending',
      stripe_session_id: `cs_test_${Date.now()}`,
      credits: 50,
      currency: 'usd',
      product_id: 'prod_test',
      product_name: 'Test Product',
    };

    console.log("Attempting to insert order:", orderData);

    // 方法1：直接使用 Supabase client
    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (insertError) {
      console.error("Direct insert failed:", {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      
      // 尝试方法2：使用 insertOrderSupabase 函数
      try {
        const { insertOrderSupabase } = await import('@/models/orderSupabase');
        const result = await insertOrderSupabase(orderData);
        console.log("insertOrderSupabase succeeded:", result);
        
        return NextResponse.json({
          success: true,
          method: 'insertOrderSupabase',
          order: result,
          testOrderNo
        });
      } catch (funcError: any) {
        console.error("insertOrderSupabase also failed:", funcError);
        
        return NextResponse.json({
          success: false,
          directInsertError: insertError,
          functionError: {
            message: funcError?.message,
            stack: funcError?.stack
          },
          orderData,
          testOrderNo
        }, { status: 500 });
      }
    }

    console.log("Order created successfully:", insertedOrder);

    // 清理测试数据
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('order_no', testOrderNo);

    if (deleteError) {
      console.warn("Failed to delete test order:", deleteError);
    }

    return NextResponse.json({
      success: true,
      method: 'direct',
      order: insertedOrder,
      testOrderNo,
      cleaned: !deleteError
    });

  } catch (error: any) {
    console.error("Unexpected error in test:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// GET 方法：检查最近的订单
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 获取最近的订单
    const { data: recentOrders, error } = await supabase
      .from('orders')
      .select('order_no, stripe_session_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 检查表的 RLS 状态
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'orders' })
      .single();

    return NextResponse.json({
      recentOrders,
      totalOrders: recentOrders?.length || 0,
      tableRLS: tableInfo,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}