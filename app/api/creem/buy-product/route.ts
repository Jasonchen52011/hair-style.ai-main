import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import config from "@/config";

const apiKey = process.env.CREEM_API_KEY;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const productId = params.get("productId");
  const userId = params.get("userId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // 检查用户当前的活跃订阅
    const { data: activeSubscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan_id, plan_name, status, end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .in('plan_name', ['monthly', 'yearly']);

    if (subscriptionError) {
      console.error("Error checking subscriptions:", subscriptionError);
      return NextResponse.json(
        { error: "Failed to verify subscription status" },
        { status: 500 }
      );
    }

    const hasActiveSubscription = activeSubscriptions && activeSubscriptions.length > 0;
    const currentSubscriptionType = hasActiveSubscription ? activeSubscriptions[0].plan_name : null;

    // 如果是按次购买产品，检查用户是否有有效的订阅
    if (productId === config.creem.products.oneTime.id) {
      if (!hasActiveSubscription) {
        return NextResponse.json({
          error: "您需要先订阅月度或年度套餐才能购买额外积分。请先选择订阅套餐。",
          requiresSubscription: true
        }, { status: 403 });
      }
    }

    // 检查是否重复购买相同类型的订阅
    if (currentSubscriptionType) {
      if (productId === config.creem.products.monthly.id && currentSubscriptionType === 'monthly') {
        return NextResponse.json({
          error: "You are already a monthly user, you cannot purchase the monthly package again.",
          duplicateSubscription: true
        }, { status: 403 });
      }
      if (productId === config.creem.products.yearly.id && currentSubscriptionType === 'yearly') {
        return NextResponse.json({
          error: "You are already a yearly user, you cannot purchase the yearly package again.",
          duplicateSubscription: true
        }, { status: 403 });
      }
    }

    // 创建支付checkout
    const result = await axios.post(
      `https://api.creem.io/v1/checkouts`,
      {
        product_id: productId,
        metadata: {
          user_id: userId
        }
      },
      {
        headers: { "x-api-key": apiKey },
      },
    );
    
    const redirectData = result.data;
    console.log("Checkout created:", redirectData);
    return NextResponse.json({ redirectData: redirectData });
    
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json({ 
      error: "Failed to create payment session" 
    }, { status: 500 });
  }
}