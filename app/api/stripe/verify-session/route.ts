import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  // 在函数内部初始化 Stripe
  const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
  
  if (!stripePrivateKey) {
    return NextResponse.json(
      { error: 'Stripe configuration error' },
      { status: 500 }
    );
  }
  
  const stripe = new Stripe(stripePrivateKey, {
    apiVersion: "2025-06-30.basil",
  });
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // 获取session详情
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 返回订单信息
    return NextResponse.json({
      orderNo: session.metadata?.order_no,
      productName: session.metadata?.product_name || "Credits",
      credits: parseInt(session.metadata?.credits || "0"),
      amount: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      customerEmail: session.customer_email,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}