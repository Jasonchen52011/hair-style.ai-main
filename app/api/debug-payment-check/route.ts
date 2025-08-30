import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id } = await request.json();
    
    if (!payment_intent_id) {
      return NextResponse.json({
        error: "payment_intent_id is required"
      }, { status: 400 });
    }
    
    console.log("Checking payment intent:", payment_intent_id);
    
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
    
    // 获取 payment intent 详情
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    console.log("Payment Intent:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata
    });
    
    // 查找相关的 checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: payment_intent_id
    });
    
    console.log("Found sessions:", sessions.data.length);
    
    let sessionData = null;
    let orderData = null;
    
    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      sessionData = {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        metadata: session.metadata
      };
      
      // 如果有 order_no，查找订单
      if (session.metadata?.order_no) {
        const { findOrderByOrderNoSupabase } = await import('@/models/orderSupabase');
        const order = await findOrderByOrderNoSupabase(session.metadata.order_no);
        orderData = order;
      }
    }
    
    return NextResponse.json({
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000).toISOString(),
        metadata: paymentIntent.metadata
      },
      session: sessionData,
      order: orderData,
      message: "Payment check completed"
    });
    
  } catch (error) {
    console.error("Debug payment check error:", error);
    return NextResponse.json({
      error: "Check failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}