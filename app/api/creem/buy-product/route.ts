import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import config from "@/config";

export const runtime = "edge";

const apiKey = process.env.CREEM_API_KEY;

export async function GET(request: NextRequest) {
  // 在函数内部创建管理员客户端（绕过RLS）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }
  
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
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

    const response = await fetch('https://api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: { 
        "x-api-key": apiKey || '',
        "Content-Type": "application/json"
      },
      body: JSON.stringify(checkoutData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }
    
    const redirectData = await response.json();
    console.log("✅ Checkout created successfully:", redirectData);
    return NextResponse.json({ redirectData: redirectData });
    
  } catch (error: any) {
    console.error("❌ Error creating checkout:", error);
    
    // 判断错误类型并提供详细信息
    if (error instanceof Error) {
      // 网络超时错误
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        console.error("🔍 Network timeout error:", {
          message: error.message,
          name: error.name
        });
        
        return NextResponse.json({ 
          error: "Network timeout - unable to reach payment service",
          details: "Request timed out"
        }, { status: 500 });
      }
      
      // 连接错误
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error("🔍 Network connection error:", {
          message: error.message,
          name: error.name
        });
        
        return NextResponse.json({ 
          error: "Network error - unable to reach payment service",
          details: error.message
        }, { status: 500 });
      }
      
      // HTTP 错误（来自我们的错误抛出）
      if (error.message.startsWith('HTTP ')) {
        const statusMatch = error.message.match(/HTTP (\d+):/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500;
        
        console.error("🔍 HTTP error details:", {
          message: error.message,
          statusCode: statusCode
        });
        
        return NextResponse.json({ 
          error: "Failed to create payment session",
          details: error.message,
          statusCode: statusCode
        }, { status: 500 });
      }
    }
    
    console.error("🔍 Unknown error:", error.message);
    return NextResponse.json({ 
      error: "Failed to create payment session",
      details: error.message || "Unknown error"
    }, { status: 500 });
  }
}