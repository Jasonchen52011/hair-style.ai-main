import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import config from "@/config";

const apiKey = process.env.CREEM_API_KEY;

// 创建管理员客户端（绕过RLS）
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const productId = params.get("productId");
  const userId = params.get("userId");

  console.log(`🔍 Buy product request - ProductId: ${productId}, UserId: ${userId}`);

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log(`🔐 User auth check - User: ${user?.id}, Error: ${userError?.message}`);
    
    if (userError || !user) {
      console.log(`❌ User not authenticated`);
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // 检查用户当前的活跃订阅 - 使用管理员客户端绕过RLS
    const { data: activeSubscriptions, error: subscriptionError } = await adminSupabase
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
          error: "please subscribe to the monthly or yearly package first.",
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://hair-style.ai');
    
    const checkoutData = {
      product_id: productId,
      metadata: {
        user_id: user.id
      },
      success_url: `${baseUrl}/payment-success?product_id=${productId}`
    };

    console.log("Creating checkout with data:", JSON.stringify(checkoutData, null, 2));
    console.log("API Key available:", !!apiKey);
    console.log("API Key value:", apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

    const result = await axios.post(
      `https://api.creem.io/v1/checkouts`,
      checkoutData,
      {
        headers: { 
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        },
      },
    );
    
    const redirectData = result.data;
    console.log("✅ Checkout created successfully:", redirectData);
    return NextResponse.json({ redirectData: redirectData });
    
  } catch (error: any) {
    console.error("❌ Error creating checkout:", error);
    
    // 如果是 axios 错误，显示更详细的信息
    if (error.response) {
      console.error("🔍 Axios error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url,
        method: error.config?.method
      });
      
      return NextResponse.json({ 
        error: "Failed to create payment session",
        details: error.response.data || error.message,
        statusCode: error.response.status
      }, { status: 500 });
    }
    
    if (error.request) {
      console.error("🔍 Network error details:", {
        message: error.message,
        code: error.code,
        timeout: error.timeout
      });
      
      return NextResponse.json({ 
        error: "Network error - unable to reach payment service",
        details: error.message || "Network timeout"
      }, { status: 500 });
    }
    
    console.error("🔍 Unknown error:", error.message);
    return NextResponse.json({ 
      error: "Failed to create payment session",
      details: error.message || "Unknown error"
    }, { status: 500 });
  }
}