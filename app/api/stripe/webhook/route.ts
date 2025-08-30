import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
// Removed unused imports - using Supabase functions instead

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  console.log("=== Webhook received ===", new Date().toISOString());
  
  // 检查所有环境变量
  const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log("Environment variables check:", {
    hasStripePrivateKey: !!stripePrivateKey,
    hasEndpointSecret: !!endpointSecret,
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseServiceKey: !!supabaseServiceKey,
    supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
  });
  
  if (!stripePrivateKey || !endpointSecret) {
    console.error("Missing Stripe configuration:", { 
      hasPrivateKey: !!stripePrivateKey, 
      hasEndpointSecret: !!endpointSecret 
    });
    return NextResponse.json(
      { error: 'Stripe configuration error' },
      { status: 500 }
    );
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration:", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseServiceKey: !!supabaseServiceKey 
    });
    return NextResponse.json(
      { error: 'Supabase configuration error' },
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
        console.log("Session metadata:", session.metadata);
        
        if (!orderNo) {
          console.error("Order number not found in session metadata:", session.metadata);
          return NextResponse.json(
            { error: "Order number not found" },
            { status: 400 }
          );
        }

        console.log(`Processing order: ${orderNo}`);

        // 查找订单 - 使用 Supabase
        console.log("Importing orderSupabase functions...");
        const { findOrderByOrderNoSupabase } = await import('@/models/orderSupabase');
        
        console.log("Searching for order in database...");
        const order = await findOrderByOrderNoSupabase(orderNo);
        console.log("Order found:", order ? `Order ID: ${order.id}, Status: ${order.status}` : "No order found");
        
        if (!order) {
          console.error(`Order not found in database: ${orderNo}`);
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

        console.log("Updating order status to paid...");
        // 更新订单状态 - 使用 Supabase
        const { updateOrderStatusSupabase } = await import('@/models/orderSupabase');
        const updatedOrder = await updateOrderStatusSupabase(
          orderNo,
          "paid",
          new Date().toISOString(),
          session.customer_email || order.user_email,
          JSON.stringify(session)
        );
        console.log("Order status updated:", updatedOrder);

        // 添加用户积分 - 使用 Supabase
        const credits = parseInt(session.metadata?.credits || "0");
        console.log(`Processing credits: ${credits} for user: ${order.user_uuid}`);
        
        if (credits > 0) {
          console.log("Updating user credits balance...");
          // 更新用户积分余额
          const { createOrUpdateUserCreditsBalanceSupabase } = await import('@/models/userCreditsBalanceSupabase');
          const balanceResult = await createOrUpdateUserCreditsBalanceSupabase(order.user_uuid, credits);
          console.log("Credits balance updated:", balanceResult);

          console.log("Creating credits transaction record...");
          // 创建积分交易记录 - 使用 Supabase
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          const transactionNo = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log("Transaction number:", transactionNo);
          
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
            console.error("Failed to insert credits transaction:", creditsError);
            console.error("Credits error details:", JSON.stringify(creditsError, null, 2));
            throw creditsError;
          }

          console.log(`Successfully added ${credits} credits to user ${order.user_uuid}`);
          console.log("Credits transaction inserted:", creditInsertData);
        } else {
          console.log("No credits to process (credits = 0)");
        }

        console.log(`Payment processing completed successfully for order: ${orderNo}`);
      } catch (error) {
        console.error("Error processing payment:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace available');
        console.error("Error details:", JSON.stringify(error, null, 2));
        return NextResponse.json(
          { error: "Failed to process payment", details: error instanceof Error ? error.message : 'Unknown error' },
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

// Edge Runtime配置已在文件顶部设置