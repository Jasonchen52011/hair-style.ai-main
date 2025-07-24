import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // 获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 查找订单（不限制user_uuid，用于调试）
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId);

    // 查找用户积分余额
    const { data: balance } = await supabase
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', user.id)
      .single();

    // 查找积分交易记录
    const { data: transactions } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // 检查Stripe session
    const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
    let stripeSession = null;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (e) {
      console.error("Failed to retrieve Stripe session:", e);
    }

    return NextResponse.json({
      debug: {
        userId: user.id,
        userEmail: user.email,
        sessionId: sessionId,
        orders: orders || [],
        orderCount: orders?.length || 0,
        orderError: orderError?.message,
        currentBalance: balance?.balance || 0,
        recentTransactions: transactions || [],
        stripeSession: stripeSession ? {
          payment_status: stripeSession.payment_status,
          status: stripeSession.status,
          metadata: stripeSession.metadata,
          customer_email: stripeSession.customer_email
        } : null
      }
    });

  } catch (error: any) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error.message || "Debug failed" },
      { status: 500 }
    );
  }
}