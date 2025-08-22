import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

// 产品类型到产品ID的映射（仅在后端使用）
const PRODUCT_TYPE_MAP = {
  "basic": "prod_SoOkvzK9C3gxpi",       // 50 Credits
  "standard": "prod_SoOnH7PUrkuz85",    // 100 Credits
  "popular": "prod_SoOlCW6Qx6pAm2",     // 400 Credits
  "professional": "prod_SoOoHIVnE6zTR0" // 800 Credits
};

// 产品配置
const CREDIT_PRODUCTS = {
  // 新商户产品ID
  "prod_SoOkvzK9C3gxpi": {
    name: "50 Credits",
    credits: 50,
    price: 500, // $5.00 in cents
  },
  "prod_SoOnH7PUrkuz85": {
    name: "100 Credits",
    credits: 100,
    price: 900, // $9.00 in cents
  },
  "prod_SoOlCW6Qx6pAm2": {
    name: "400 Credits (Most Popular)",
    credits: 400,
    price: 1900, // $19.00 in cents
  },
  "prod_SoOoHIVnE6zTR0": {
    name: "800 Credits",
    credits: 800,
    price: 3600, // $36.00 in cents
  },
};

export async function POST(request: NextRequest) {
  try {
    console.log("=== Checkout Session Creation Started ===");
    
    // 检查环境变量
    if (!process.env.STRIPE_PRIVATE_KEY) {
      console.error("STRIPE_PRIVATE_KEY is not set");
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }
    
    // 在函数内部初始化 Stripe
    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY, {
      apiVersion: "2025-06-30.basil",
    });

    const { productType } = await request.json();
    console.log("Product Type:", productType);

    // 将产品类型映射到实际的产品ID
    const productId = PRODUCT_TYPE_MAP[productType as keyof typeof PRODUCT_TYPE_MAP];
    if (!productId) {
      return NextResponse.json(
        { error: "Invalid product type" },
        { status: 400 }
      );
    }

    // 验证产品ID
    const product = CREDIT_PRODUCTS[productId as keyof typeof CREDIT_PRODUCTS];
    if (!product) {
      return NextResponse.json(
        { error: "Invalid product configuration" },
        { status: 500 }
      );
    }

    // 使用 Supabase 获取用户信息
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log("Auth check:", { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email,
      authError 
    });

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to continue" },
        { status: 401 }
      );
    }

    // 创建简单的订单号
    const orderNo = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log("Order number:", orderNo);

    try {
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
              unit_amount: product.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        // 使用请求的 origin 来确保重定向到正确的环境
        success_url: `${process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || 
          (request.headers.get('origin') || 'https://hair-style.ai') + '/my-orders'}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.NEXT_PUBLIC_PAY_CANCEL_URL || 
          (request.headers.get('origin') || 'https://hair-style.ai') + '/pricing',
        metadata: {
          order_no: orderNo,
          user_id: user.id,
          user_email: user.email || '',
          product_id: productId,
          credits: product.credits.toString(),
        },
        customer_email: user.email,
      });

      console.log("Stripe session created:", session.id);

      // 创建订单记录到数据库
      const { insertOrderSupabase } = await import('@/models/orderSupabase');
      const orderData = {
        order_no: orderNo,
        created_at: new Date().toISOString(),
        user_uuid: user.id,
        user_email: user.email || '',
        amount: product.price,
        status: 'pending',
        stripe_session_id: session.id,
        credits: product.credits,
        currency: 'usd',
        product_id: productId,
        product_name: product.name,
      };

      try {
        await insertOrderSupabase(orderData);
        console.log("Order created successfully:", orderNo);
      } catch (orderError: any) {
        console.error("Failed to create order record:", {
          error: orderError,
          message: orderError?.message,
          details: orderError?.details,
          hint: orderError?.hint,
          code: orderError?.code,
          orderData: orderData
        });
        // 继续返回 session，不要因为订单记录失败而中断支付流程
        // 但要记录这个问题，后续通过 webhook 的 metadata 来补救
      }

      return NextResponse.json({
        sessionId: session.id,
        publishableKey: process.env.STRIPE_PUBLIC_KEY,
      });
    } catch (stripeError: any) {
      console.error("Stripe API Error:", stripeError);
      return NextResponse.json(
        { 
          error: `Stripe error: ${stripeError.message}`,
          type: stripeError.type,
          code: stripeError.code
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}