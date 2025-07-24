import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
// Removed unused imports - using Supabase functions instead

export async function POST(request: NextRequest) {
  console.log("=== Webhook received ===");
  
  // 在函数内部初始化 Stripe
  const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log("Webhook secret configured:", !!endpointSecret);
  
  if (!stripePrivateKey || !endpointSecret) {
    console.error("Missing configuration:", { 
      hasPrivateKey: !!stripePrivateKey, 
      hasEndpointSecret: !!endpointSecret 
    });
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }
  
  const stripe = new Stripe(stripePrivateKey, {
    apiVersion: "2025-06-30.basil",
  });
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    // 验证webhook签名
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log("Event type:", event.type);
  console.log("Event ID:", event.id);
  
  // 处理事件
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Processing checkout session:", session.id);
      console.log("Session metadata:", session.metadata);
      
      try {
        // 获取订单信息
        const orderNo = session.metadata?.order_no;
        if (!orderNo) {
          console.error("Order number not found in session metadata");
          return NextResponse.json(
            { error: "Order number not found" },
            { status: 400 }
          );
        }

        // 查找订单 - 使用 Supabase
        const { findOrderByOrderNoSupabase } = await import('@/models/orderSupabase');
        const order = await findOrderByOrderNoSupabase(orderNo);
        if (!order) {
          console.error(`Order not found: ${orderNo}`);
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        // 检查订单是否已处理
        if (order.status === "paid") {
          console.log(`Order already processed: ${orderNo}`);
          return NextResponse.json({ received: true });
        }

        // 更新订单状态 - 使用 Supabase
        const { updateOrderStatusSupabase } = await import('@/models/orderSupabase');
        await updateOrderStatusSupabase(
          orderNo,
          "paid",
          new Date().toISOString(),
          session.customer_email || order.user_email,
          JSON.stringify(session)
        );

        // 添加用户积分 - 使用 Supabase
        const credits = parseInt(session.metadata?.credits || "0");
        if (credits > 0) {
          // 更新用户积分余额
          const { createOrUpdateUserCreditsBalanceSupabase } = await import('@/models/userCreditsBalanceSupabase');
          await createOrUpdateUserCreditsBalanceSupabase(order.user_uuid, credits);

          // 创建积分交易记录 - 使用 Supabase
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          const transactionNo = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await supabase
            .from('credits')
            .insert([{
              trans_no: transactionNo,
              created_at: new Date().toISOString(),
              user_uuid: order.user_uuid,
              trans_type: "purchase",
              credits: credits,
              order_no: orderNo,
            }]);

          console.log(`Added ${credits} credits to user ${order.user_uuid}`);
        }

        console.log(`Payment successful for order: ${orderNo}`);
      } catch (error) {
        console.error("Error processing payment:", error);
        return NextResponse.json(
          { error: "Failed to process payment" },
          { status: 500 }
        );
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed: ${paymentIntent.id}`);
      // 可以在这里处理支付失败的逻辑
      break;
    }

    case "charge.succeeded": {
      // 可选：处理 charge.succeeded 事件
      const charge = event.data.object as Stripe.Charge;
      console.log(`Charge succeeded: ${charge.id}, amount: ${charge.amount}`);
      // 注意：charge 事件可能没有订单元数据，建议使用 checkout.session.completed
      break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// 配置API路由以接收原始body
export const runtime = "nodejs";