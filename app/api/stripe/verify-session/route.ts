import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function GET(request: NextRequest) {
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