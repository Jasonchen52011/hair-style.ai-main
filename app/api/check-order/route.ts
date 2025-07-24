import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { order_no } = await request.json();
    
    if (!order_no) {
      return NextResponse.json({ error: "Order number required" }, { status: 400 });
    }

    // 使用service role创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 查找订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_no', order_no)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ 
        error: "Order not found", 
        details: orderError 
      }, { status: 404 });
    }

    // 查找用户积分余额
    const { data: balance } = await supabase
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', order.user_uuid)
      .single();

    // 查找相关的积分交易记录
    const { data: transactions } = await supabase
      .from('credits')
      .select('*')
      .eq('order_no', order_no);

    return NextResponse.json({
      order: {
        order_no: order.order_no,
        status: order.status,
        credits: order.credits,
        amount: order.amount,
        created_at: order.created_at,
        paid_at: order.paid_at,
        user_uuid: order.user_uuid,
        stripe_session_id: order.stripe_session_id
      },
      user_balance: balance?.balance || 0,
      credit_transactions: transactions || [],
      analysis: {
        order_status_is_paid: order.status === 'paid',
        has_credit_transaction: transactions && transactions.length > 0,
        expected_credits: order.credits,
        actual_balance: balance?.balance || 0
      }
    });

  } catch (error: any) {
    console.error("Check order error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}