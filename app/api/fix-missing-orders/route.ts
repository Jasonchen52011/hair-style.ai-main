import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Fix Missing Orders ===");
    
    const { payment_intents } = await request.json();
    
    if (!payment_intents || !Array.isArray(payment_intents)) {
      return NextResponse.json({
        error: "payment_intents array is required"
      }, { status: 400 });
    }
    
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
    
    // 初始化 Supabase
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
    
    const results = [];
    
    for (const payment_intent_id of payment_intents) {
      try {
        console.log(`Processing payment intent: ${payment_intent_id}`);
        
        // 获取 payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        console.log(`Payment Intent status: ${paymentIntent.status}, amount: ${paymentIntent.amount}`);
        
        // 获取相关的 checkout session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: payment_intent_id
        });
        
        if (sessions.data.length === 0) {
          results.push({
            payment_intent_id,
            error: "No checkout session found"
          });
          continue;
        }
        
        const session = sessions.data[0];
        console.log(`Session found: ${session.id}, status: ${session.status}, payment_status: ${session.payment_status}`);
        
        if (session.payment_status !== "paid") {
          results.push({
            payment_intent_id,
            error: `Session not paid: ${session.payment_status}`
          });
          continue;
        }
        
        // 检查是否已有订单
        let orderNo = session.metadata?.order_no;
        
        if (!orderNo) {
          // 生成新的订单号
          orderNo = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log(`Generated new order number: ${orderNo}`);
        }
        
        // 检查订单是否已存在
        const { findOrderByOrderNoSupabase } = await import('@/models/orderSupabase');
        const existingOrder = await findOrderByOrderNoSupabase(orderNo);
        
        if (existingOrder) {
          results.push({
            payment_intent_id,
            message: "Order already exists",
            order: existingOrder
          });
          continue;
        }
        
        // 获取积分信息（从 metadata 或估算）
        const credits = parseInt(session.metadata?.credits || "50"); // 默认 50 积分
        const userEmail = session.customer_email || session.customer_details?.email;
        const userId = session.metadata?.user_id;
        
        if (!userEmail) {
          results.push({
            payment_intent_id,
            error: "No customer email found"
          });
          continue;
        }
        
        // 获取或创建用户 UUID
        let userUuid = userId;
        if (!userUuid) {
          // 查找用户
          const { data: user } = await supabase
            .from('users')
            .select('uuid')
            .eq('email', userEmail)
            .single();
            
          if (user) {
            userUuid = user.uuid;
          } else {
            // 生成新的 UUID
            userUuid = crypto.randomUUID();
          }
        }
        
        console.log(`User UUID: ${userUuid}, Credits: ${credits}`);
        
        // 创建订单记录
        const { insertOrderSupabase } = await import('@/models/orderSupabase');
        const orderData = {
          order_no: orderNo,
          user_uuid: userUuid,
          user_email: userEmail,
          amount: paymentIntent.amount,
          credits: credits,
          status: "paid",
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
          paid_email: userEmail,
          paid_detail: JSON.stringify(session),
          currency: paymentIntent.currency || "usd",
          product_name: `${credits} Credits`,
          created_at: new Date(paymentIntent.created * 1000).toISOString()
        };
        
        const order = await insertOrderSupabase(orderData);
        console.log(`Order created: ${order.id}`);
        
        // 更新用户积分余额
        const { createOrUpdateUserCreditsBalanceSupabase } = await import('@/models/userCreditsBalanceSupabase');
        const balanceResult = await createOrUpdateUserCreditsBalanceSupabase(userUuid, credits);
        console.log(`Credits balance updated: ${balanceResult.balance}`);
        
        // 创建积分交易记录
        const transactionNo = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const { data: creditTransaction, error: creditsError } = await supabase
          .from('credits')
          .insert([{
            trans_no: transactionNo,
            created_at: new Date(paymentIntent.created * 1000).toISOString(),
            user_uuid: userUuid,
            trans_type: "purchase",
            credits: credits,
            order_no: orderNo,
          }])
          .select()
          .single();
        
        if (creditsError) {
          throw creditsError;
        }
        
        console.log(`Credits transaction created: ${creditTransaction.id}`);
        
        results.push({
          payment_intent_id,
          success: true,
          order: order,
          credits_balance: balanceResult,
          credits_transaction: creditTransaction
        });
        
      } catch (error) {
        console.error(`Error processing ${payment_intent_id}:`, error);
        results.push({
          payment_intent_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Processing completed",
      results: results
    });
    
  } catch (error) {
    console.error("Fix missing orders error:", error);
    return NextResponse.json({
      error: "Processing failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}