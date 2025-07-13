// Polyfill for URL.canParse (Node.js < 19.9.0)
if (!URL.canParse) {
  URL.canParse = function(url: string, base?: string): boolean {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 🚫 API已禁用 - 所有支付处理现在通过webhook进行
  console.log('🚫 Update user meta API is disabled. All payment processing is now handled through webhook.');
  
  return NextResponse.json({
    success: false,
    message: 'This API has been disabled. All payment processing is now handled through webhook.',
    disabled: true
  }, { status: 410 }); // 410 Gone - 资源已被永久移除

  /* 原有代码已禁用
  const payload = await request.json();
  const userId = payload.userId;
  const meta = payload.meta;
  const paymentParams = payload.paymentParams;

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 },
    );
  }

  // 使用service role key创建管理员客户端
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // 如果有paymentParams，则验证支付
  if (paymentParams) {
    try {
      const { data } = await axios.get<Record<string, any>>(
        `https://api.creem.io/v1/checkouts?checkout_id=${paymentParams.checkout_id}`,
        {
          headers: { "x-api-key": process.env.CREEM_API_KEY },
        },
      );
      console.log("checkout data", data, paymentParams.order_id);
      
      // 验证checkout是否存在且状态为completed
      if (!data?.status || data.status !== 'completed') {
        return NextResponse.json({ message: "Invalid payment status" }, { status: 400 });
      }
      
      // 验证order存在
      if (!data?.order?.id) {
        return NextResponse.json({ message: "Order not found" }, { status: 400 });
      }
      
      // 如果有subscription，验证subscription
      if (
        data?.subscription?.id &&
        paymentParams.subscription_id &&
        data?.subscription?.id !== paymentParams.subscription_id
      ) {
        return NextResponse.json(
          { message: "Invalid subscription" },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 400 }
      );
    }
  }

  try {
    // 检查是否已经处理过这个订单 - 检查具体的订阅记录
    if (paymentParams && paymentParams.order_id) {
      const subscriptionIdentifier = paymentParams.subscription_id || `onetime_${paymentParams.order_id}`;
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id, credits')
        .eq('user_id', userId)
        .eq('creem_subscription_id', subscriptionIdentifier)
        .single();
      
      if (existingSubscription) {
        console.log("Order already processed, skipping update:", paymentParams.order_id);
        return NextResponse.json(
          {
            message: "Order already processed",
            alreadyProcessed: true,
            credits: existingSubscription.credits
          },
          { status: 200 },
        );
      }
    }

    // 更新用户profile（使用正确的字段名和时间格式）
    const now = new Date();
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: null, // 可选字段
        name: null, // 实际字段名是 name，不是 full_name
        image: null, // 实际字段名是 image，不是 avatar_url
        customer_id: paymentParams?.customer_id || null,
        product_id: null, // 可以存储产品ID
        has_access: true, // 支付成功后给予访问权限
        created_at: now.toISOString(), // 修复：使用完整的ISO时间戳
        updated_at: now.toISOString(), // 添加更新时间
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return NextResponse.json(
        { message: "Failed to update user profile", error: profileError.message },
        { status: 500 }
      );
    }

    // 为所有购买创建订阅记录（包括一次性购买）
    const membershipType = meta.membership || 'onetime';
    const planId = membershipType === 'monthly' ? 'pro_monthly' : 
                   membershipType === 'yearly' ? 'pro_yearly' : 'onetime';
    
    const startDate = new Date();
    const endDate = new Date(startDate);
      
    if (membershipType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
    } else if (membershipType === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // 一次性购买设置长期有效（10年）
      endDate.setFullYear(endDate.getFullYear() + 10);
      }

    // 创建 subscriptionIdentifier
    const subscriptionIdentifier = paymentParams?.subscription_id || `onetime_${paymentParams?.order_id}`;

      // 直接创建新订阅（因为上面已经检查过重复了）
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          plan_name: membershipType,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          creem_subscription_id: subscriptionIdentifier,
          credits: parseInt((meta.credits || 0).toString()),
          created_at: startDate.toISOString(), // 添加创建时间
          updated_at: startDate.toISOString(), // 添加更新时间
        });

      if (subscriptionError) {
        console.error("Error updating subscription:", subscriptionError);
        return NextResponse.json(
        { message: "Failed to update subscription", error: subscriptionError.message },
          { status: 500 }
        );
    }

    // 创建订单记录
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: paymentParams?.order_id || `meta_${Date.now()}`,
        product_id: paymentParams?.product_id || planId,
        product_name: `${membershipType} subscription`,
        plan_type: membershipType,
        amount: null,
        currency: null, // 添加货币字段
        status: 'completed',
        checkout_id: paymentParams?.checkout_id,
        subscription_id: subscriptionIdentifier,
        credits_granted: parseInt((meta.credits || 0).toString()),
        payment_method: null, // 添加支付方式字段
        payment_date: startDate.toISOString(),
        created_at: startDate.toISOString(), // 添加创建时间
        updated_at: startDate.toISOString(), // 添加更新时间
      })
      .select();

    if (orderError) {
      console.error("Error creating order record:", orderError);
      // 不让订单记录失败影响主流程
    } else {
      console.log("✅ Order record created:", orderData);
    }

    // 🔥 重要修复：在credits表中添加积分记录
    const creditsAmount = parseInt((meta.credits || 0).toString());
    if (creditsAmount > 0) {
      const transactionNo = `${membershipType.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
      
      // 根据订阅类型设置过期时间
      let expiredAt = null;
      if (membershipType === 'monthly') {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setHours(0, 0, 0, 0);
        expiredAt = nextMonth.toISOString();
      }
      // 年度订阅和一次性购买不设置过期时间（年度订阅通过月度分配管理）

      // 获取当前积分
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('profiles')
        .select('current_credits')
        .eq('id', userId)
        .single();

      const currentCredits = currentProfile?.current_credits || 0;

      // 同时更新credits表和profiles表
      const [creditResult, profileUpdateResult] = await Promise.all([
        supabase
          .from('credits')
          .insert({
            user_uuid: userId,
            trans_type: 'purchase',
            trans_no: transactionNo,
            order_no: paymentParams?.order_id || `${membershipType}_${Date.now()}`,
            credits: creditsAmount, // 正数表示获得积分
            expired_at: expiredAt,
            created_at: new Date().toISOString()
          }),
        supabase
          .from('profiles')
          .update({
            current_credits: currentCredits + creditsAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      ]);

      if (creditResult.error) {
        console.error("Error adding credits record:", creditResult.error);
        // 不要因为积分记录失败而让整个流程失败，但要记录错误
        console.error(`Failed to add ${creditsAmount} credits record for user ${userId}, transaction: ${transactionNo}`);
      } else if (profileUpdateResult.error) {
        console.error("Error updating profile credits:", profileUpdateResult.error);
        console.error(`Failed to update profile credits for user ${userId}, transaction: ${transactionNo}`);
      } else {
        console.log(`✅ Successfully added ${creditsAmount} credits for user ${userId}, transaction: ${transactionNo}`);
      }
    }
    
    console.log("User metadata updated successfully for user:", userId);
    
    return NextResponse.json(
      {
        message: "User metadata updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return NextResponse.json(
      { message: "Failed to update user metadata" },
      { status: 500 }
    );
  }
}
*/
}