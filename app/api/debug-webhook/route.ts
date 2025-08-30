import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Debug Webhook Test ===");
    
    const { session_id } = await request.json();
    
    if (!session_id) {
      return NextResponse.json({
        error: "session_id is required"
      }, { status: 400 });
    }
    
    console.log("Testing session:", session_id);
    
    // 初始化 Stripe
    const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
    if (!stripePrivateKey) {
      return NextResponse.json({
        error: "Stripe not configured"
      }, { status: 500 });
    }
    
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripePrivateKey, {
      apiVersion: "2025-06-30.basil",
    });
    
    // 获取 session 详情
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Session retrieved:", {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata
    });
    
    if (session.payment_status !== "paid") {
      return NextResponse.json({
        error: "Session not paid",
        session: {
          id: session.id,
          payment_status: session.payment_status
        }
      });
    }
    
    // 手动触发 webhook 处理逻辑
    const orderNo = session.metadata?.order_no;
    console.log("Order number from metadata:", orderNo);
    
    if (!orderNo) {
      return NextResponse.json({
        error: "No order_no in session metadata",
        metadata: session.metadata
      });
    }
    
    // 查找订单
    const { findOrderByOrderNoSupabase } = await import('@/models/orderSupabase');
    const order = await findOrderByOrderNoSupabase(orderNo);
    console.log("Order found:", order);
    
    if (!order) {
      return NextResponse.json({
        error: "Order not found in database",
        orderNo: orderNo
      });
    }
    
    // 检查订单状态
    if (order.status === "paid") {
      return NextResponse.json({
        message: "Order already processed",
        order: order
      });
    }
    
    // 更新订单状态
    const { updateOrderStatusSupabase } = await import('@/models/orderSupabase');
    const updatedOrder = await updateOrderStatusSupabase(
      orderNo,
      "paid",
      new Date().toISOString(),
      session.customer_email || order.user_email,
      JSON.stringify(session)
    );
    
    // 处理积分
    const credits = parseInt(session.metadata?.credits || "0");
    let creditResult = null;
    
    if (credits > 0) {
      const { createOrUpdateUserCreditsBalanceSupabase } = await import('@/models/userCreditsBalanceSupabase');
      creditResult = await createOrUpdateUserCreditsBalanceSupabase(order.user_uuid, credits);
      
      // 创建积分交易记录
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
      
      const transactionNo = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: creditInsertData, error: creditsError } = await supabase
        .from('credits')
        .insert([{
          trans_no: transactionNo,
          created_at: new Date().toISOString(),
          user_uuid: order.user_uuid,
          trans_type: "purchase",
          credits: credits,
          order_no: orderNo,
        }])
        .select();
      
      if (creditsError) {
        throw creditsError;
      }
      
      creditResult = {
        balance: creditResult,
        transaction: creditInsertData
      };
    }
    
    return NextResponse.json({
      success: true,
      message: "Manual webhook processing completed",
      session: {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata
      },
      order: updatedOrder,
      credits: creditResult
    });
    
  } catch (error) {
    console.error("Debug webhook error:", error);
    return NextResponse.json({
      error: "Processing failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}