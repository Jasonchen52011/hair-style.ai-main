import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserEmail, getUserUuid } from "@/services/userSupabase";
import { insertOrderSupabase } from "@/models/orderSupabase";
import { STRIPE_PRODUCTS, getStripeProduct, isValidStripeProductId } from "@/config/stripe-config";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // 检查环境变量
    if (!process.env.STRIPE_PRIVATE_KEY) {
      console.error("STRIPE_PRIVATE_KEY is not set");
      return NextResponse.json(
        { error: "Stripe configuration error. Please check server logs." },
        { status: 500 }
      );
    }
    
    // 在函数内部初始化 Stripe
    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY, {
      apiVersion: "2025-08-27.basil",
    });

    const { productId } = await request.json();

    // 验证产品ID
    if (!isValidStripeProductId(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = getStripeProduct(productId);

    // 获取用户信息
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const userEmail = await getUserEmail();
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // 创建订单号 - 使用更简单的格式避免问题
    const orderNo = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建订单记录
    const order = {
      order_no: orderNo,
      created_at: new Date(),
      user_uuid: userUuid,
      user_email: userEmail,
      amount: Math.round(product.price * 100), // 转换为cents
      interval: "one-time",
      status: "created",
      credits: product.credits,
      currency: "usd",
      product_id: productId,
      product_name: product.name,
    };

    // 创建Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: `${product.credits} credits for Hairstyle AI`,
            },
            unit_amount: Math.round(product.price * 100), // 转换为cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_PAY_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.NEXT_PUBLIC_PAY_CANCEL_URL || `${process.env.NEXT_PUBLIC_WEB_URL}/#pricing`,
      metadata: {
        order_no: orderNo,
        user_uuid: userUuid,
        user_email: userEmail,
        product_id: productId,
        credits: product.credits.toString(),
      },
      customer_email: userEmail,
    });

    // 创建订单记录，包含session ID
    await insertOrderSupabase({
      ...order,
      stripe_session_id: session.id,
    });

    return NextResponse.json({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLIC_KEY,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code
    });
    
    // 返回更详细的错误信息
    return NextResponse.json(
      { 
        error: error.message || "Failed to create checkout session",
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          type: error.type,
          code: error.code
        } : undefined
      },
      { status: 500 }
    );
  }
}