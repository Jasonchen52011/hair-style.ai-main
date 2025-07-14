import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import config from "@/config";

// 创建管理员客户端（绕过RLS）
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const productId = params.get("productId");
  const userId = params.get("userId");

  console.log(`🧪 [TEST] Buy product request - ProductId: ${productId}, UserId: ${userId}`);

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "User ID is required for testing" }, { status: 400 });
  }

  try {
    // 首先确保测试用户存在于profiles表中
    const { data: existingProfile, error: profileCheckError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileCheckError && profileCheckError.code === 'PGRST116') {
      // 用户不存在，创建一个测试用户
      console.log(`🧪 [TEST] Creating test user profile: ${userId}`);
      
      const { error: createProfileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: userId,
          email: `test-${userId.substring(0, 8)}@example.com`,
          name: `Test User ${userId.substring(0, 8)}`,
          has_access: true,
          current_credits: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createProfileError) {
        console.error("❌ [TEST] Error creating test user:", createProfileError);
        return NextResponse.json(
          { error: "Failed to create test user" },
          { status: 500 }
        );
      }
      
      console.log("✅ [TEST] Test user created successfully");
    }

    // 检查用户当前的活跃订阅
    const { data: activeSubscriptions, error: subscriptionError } = await adminSupabase
      .from('subscriptions')
      .select('plan_id, plan_name, status, end_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .in('plan_name', ['monthly', 'yearly']);

    if (subscriptionError) {
      console.error("❌ [TEST] Error checking subscriptions:", subscriptionError);
      return NextResponse.json(
        { error: "Failed to verify subscription status" },
        { status: 500 }
      );
    }

    const hasActiveSubscription = activeSubscriptions && activeSubscriptions.length > 0;
    const currentSubscriptionType = hasActiveSubscription ? activeSubscriptions[0].plan_name : null;

    console.log(`🧪 [TEST] User subscription status:`, {
      hasActiveSubscription,
      currentSubscriptionType,
      activeSubscriptions
    });

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

    // 检查是否已经有相同产品的待处理订单（基于时间窗口的幂等性）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentOrders, error: recentOrderError } = await adminSupabase
      .from('orders')
      .select('order_id, product_id, status, created_at')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .gte('created_at', fiveMinutesAgo)
      .eq('status', 'completed');

    if (recentOrderError) {
      console.warn("⚠️ [TEST] Error checking recent orders:", recentOrderError);
    }

    if (recentOrders && recentOrders.length > 0) {
      console.log(`🧪 [TEST] Found recent duplicate order:`, recentOrders[0]);
      return NextResponse.json({
        error: "Duplicate order detected. Please wait a few minutes before trying again.",
        duplicateOrder: true,
        recentOrder: recentOrders[0]
      }, { status: 409 });
    }

    // 模拟成功的checkout创建
    const mockCheckoutId = `test-checkout-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const mockCheckoutUrl = `https://test-checkout.example.com/checkout/${mockCheckoutId}`;
    
    // 记录测试订单（可选，用于跟踪测试）
    try {
      // 简化产品名称和类型的获取
      let productName = 'Unknown Product';
      let planType = 'unknown';
      
      if (productId === config.creem.products.oneTime.id) {
        productName = config.creem.products.oneTime.name;
        planType = 'onetime';
      } else if (productId === config.creem.products.monthly.id) {
        productName = config.creem.products.monthly.name;
        planType = 'monthly';
      } else if (productId === config.creem.products.yearly.id) {
        productName = config.creem.products.yearly.name;
        planType = 'yearly';
      }

      await adminSupabase
        .from('orders')
        .insert({
          user_id: userId,
          order_id: `test-${mockCheckoutId}`,
          product_id: productId,
          product_name: `Test ${productName}`,
          plan_type: planType,
          status: 'pending',
          checkout_id: mockCheckoutId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (orderError) {
      console.warn("⚠️ [TEST] Error creating test order record:", orderError);
      // 不影响主流程
    }

    const redirectData = {
      checkout_id: mockCheckoutId,
      checkout_url: mockCheckoutUrl,
      status: 'pending',
      test_mode: true
    };

    console.log("✅ [TEST] Mock checkout created successfully:", redirectData);
    return NextResponse.json({ redirectData: redirectData });
    
  } catch (error) {
    console.error("❌ [TEST] Error in test buy-product:", error);
    
    return NextResponse.json({ 
      error: "Failed to create test payment session",
      details: error instanceof Error ? error.message : "Unknown error",
      test_mode: true
    }, { status: 500 });
  }
} 