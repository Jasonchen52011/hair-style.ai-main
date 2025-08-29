import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import Stripe from "stripe";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    // 初始化 Stripe
    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
      apiVersion: "2025-06-30.basil",
    });

    // 初始化 Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 从 Stripe 获取 session 信息
    let stripeSession = null;
    let stripeError = null;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error: any) {
      stripeError = error.message;
    }

    // 2. 从 orders 表查找订单
    let order = null;
    if (stripeSession?.metadata?.order_no) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('order_no', stripeSession.metadata.order_no)
        .single();
      order = data;
    }

    // 也尝试通过 session_id 查找
    if (!order) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();
      order = data;
    }

    // 3. 查找用户的积分记录
    let creditsRecords = [];
    let userBalance = null;
    
    if (order?.user_uuid) {
      // 查找积分交易记录
      const { data: credits } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', order.user_uuid)
        .order('created_at', { ascending: false })
        .limit(10);
      creditsRecords = credits || [];

      // 查找用户积分余额
      const { data: balance } = await supabase
        .from('user_credits_balance')
        .select('*')
        .eq('user_uuid', order.user_uuid)
        .single();
      userBalance = balance;
    }

    // 4. 查找与订单相关的积分记录
    let orderCredits = null;
    if (order?.order_no) {
      const { data } = await supabase
        .from('credits')
        .select('*')
        .eq('order_no', order.order_no);
      orderCredits = data;
    }

    // 5. 分析问题
    const analysis = {
      hasStripeSession: !!stripeSession,
      stripePaymentStatus: stripeSession?.payment_status,
      stripeMetadata: stripeSession?.metadata,
      hasOrder: !!order,
      orderStatus: order?.status,
      orderCredits: order?.credits,
      hasCreditsRecord: orderCredits && orderCredits.length > 0,
      userCurrentBalance: userBalance?.balance || 0,
      expectedCredits: stripeSession?.metadata?.credits || order?.credits,
    };

    // 诊断问题
    const issues = [];
    if (!stripeSession) {
      issues.push("❌ Stripe session not found - Invalid session ID");
    } else if (stripeSession.payment_status !== 'paid') {
      issues.push(`⚠️ Payment status is '${stripeSession.payment_status}', not 'paid'`);
    }

    if (!order) {
      issues.push("❌ Order not found in database");
      if (stripeSession?.metadata?.order_no) {
        issues.push(`   Looking for order_no: ${stripeSession.metadata.order_no}`);
      }
    } else {
      if (order.status !== 'paid') {
        issues.push(`⚠️ Order status is '${order.status}', not 'paid'`);
      }
    }

    if (order && !orderCredits?.length) {
      issues.push("❌ No credits record found for this order");
    }

    if (order && userBalance?.balance === 0) {
      issues.push("❌ User balance is 0");
    }

    return NextResponse.json({
      success: true,
      sessionId,
      analysis,
      issues,
      data: {
        stripeSession: stripeSession ? {
          id: stripeSession.id,
          payment_status: stripeSession.payment_status,
          customer_email: stripeSession.customer_email,
          metadata: stripeSession.metadata,
          amount_total: stripeSession.amount_total,
          created: new Date(stripeSession.created * 1000).toISOString(),
        } : null,
        stripeError,
        order,
        orderCredits,
        userBalance,
        recentCreditsRecords: creditsRecords.slice(0, 5),
      }
    });

  } catch (error: any) {
    console.error("Debug check error:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}