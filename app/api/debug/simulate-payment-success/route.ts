import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProductCreditsMap, getProductPlanMap } from "../../../../config";

// 管理员客户端
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_CREDITS_MAP = getProductCreditsMap();
const PRODUCT_PLAN_MAP = getProductPlanMap();

// 生成测试数据
function generateTestData() {
  const timestamp = Date.now();
  // 生成UUID格式的用户ID
  const testUserId = generateUUID();
  const testOrderId = `test_order_${timestamp}`;
  const testCheckoutId = `test_checkout_${timestamp}`;
  const testSubscriptionId = `test_sub_${timestamp}`;
  
  return {
    userId: testUserId,
    orderId: testOrderId,
    checkoutId: testCheckoutId,
    subscriptionId: testSubscriptionId,
    timestamp
  };
}

// 生成UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 验证UUID格式
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

/**
 * POST - 模拟支付成功测试
 * 查询参数：
 * - product_type: 产品类型 (onetime, monthly, yearly)
 * - user_id: 自定义用户ID（可选）
 * - order_id: 自定义订单ID（可选）
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productType = searchParams.get('product_type') || 'onetime';
  const customUserId = searchParams.get('user_id');
  const customOrderId = searchParams.get('order_id');
  
  try {
    console.log('🧪 Starting payment success simulation...');
    
    // 验证产品类型
    if (!['onetime', 'monthly', 'yearly'].includes(productType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product_type. Must be: onetime, monthly, or yearly'
      }, { status: 400 });
    }

    // 获取产品信息
    const productId = Object.keys(PRODUCT_PLAN_MAP).find(id => 
      PRODUCT_PLAN_MAP[id] === productType
    );
    
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: `Product not found for type: ${productType}`
      }, { status: 400 });
    }

    const credits = PRODUCT_CREDITS_MAP[productId];
    
    // 生成或使用自定义测试数据
    const testData = generateTestData();
    let userId = testData.userId;
    
    // 如果提供了自定义用户ID，验证其格式
    if (customUserId) {
      if (!isValidUUID(customUserId)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid user_id format. Must be a valid UUID format.',
          example: 'e.g., 123e4567-e89b-12d3-a456-426614174000'
        }, { status: 400 });
      }
      userId = customUserId;
    }
    const orderId = customOrderId || testData.orderId;
    const checkoutId = testData.checkoutId;
    const subscriptionId = testData.subscriptionId;

    console.log('📊 Test data generated:', {
      userId,
      productId,
      productType,
      credits,
      orderId,
      checkoutId,
      subscriptionId
    });

    // 模拟支付成功处理
    const paymentResult = await simulatePaymentSuccess(
      userId,
      productId,
      subscriptionId,
      orderId,
      checkoutId
    );

    // 获取处理后的数据反馈
    const dataFeedback = await getDataFeedback(userId, orderId);

    return NextResponse.json({
      success: true,
      message: 'Payment success simulation completed',
      testData: {
        userId,
        productId,
        productType,
        credits,
        orderId,
        checkoutId,
        subscriptionId
      },
      paymentResult,
      dataFeedback,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Payment simulation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Payment simulation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - 查看测试数据列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const orderId = searchParams.get('order_id');
  
  try {
    // 查询最近的测试数据
    let query = adminSupabase
      .from('credits')
      .select('*')
      .eq('trans_type', 'purchase')
      .order('created_at', { ascending: false })
      .limit(10);

    if (userId) {
      query = query.eq('user_uuid', userId);
    }

    if (orderId) {
      query = query.eq('order_no', orderId);
    }

    const { data: credits, error: creditsError } = await query;

    if (creditsError) {
      throw new Error(`Failed to fetch credits: ${creditsError.message}`);
    }

    // 查询对应的用户信息
    const userIds = [...new Set(credits.map(c => c.user_uuid))];
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // 查询对应的订阅信息
    const { data: subscriptions, error: subscriptionsError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      throw new Error(`Failed to fetch subscriptions: ${subscriptionsError.message}`);
    }

    // 查询对应的订单信息
    const { data: orders, error: ordersError } = await adminSupabase
      .from('orders')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        credits,
        profiles,
        subscriptions,
        orders
      },
      summary: {
        totalCredits: credits.length,
        totalProfiles: profiles.length,
        totalSubscriptions: subscriptions.length,
        totalOrders: orders.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch test data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch test data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 模拟支付成功处理逻辑
async function simulatePaymentSuccess(
  userId: string,
  planId: string,
  subscriptionId: string,
  orderId: string,
  checkoutId: string
) {
  console.log(`🎉 Simulating payment success for user ${userId}, plan ${planId}`);

  const credits = PRODUCT_CREDITS_MAP[planId] || 0;
  const planType = PRODUCT_PLAN_MAP[planId] || 'onetime';

  console.log(`💰 Credits to add: ${credits}, Plan type: ${planType}`);

  try {
    // 首先创建一个模拟的auth用户（仅用于测试）
    const now = new Date();
    const timeString = now.toISOString();
    
    // 尝试在auth.users表中创建测试用户记录（如果不存在）
    try {
      const { data: authUser, error: authUserError } = await adminSupabase.auth.admin.createUser({
        id: userId,
        email: `${userId}@test.example.com`,
        password: 'test-password-123',
        email_confirm: true,
        user_metadata: {
          full_name: `Test User ${userId.substring(0, 8)}`,
          avatar_url: null
        }
      });

      if (authUserError && !authUserError.message.includes('already exists')) {
        console.error('❌ Error creating auth user:', authUserError);
        throw new Error(`Failed to create auth user: ${authUserError.message}`);
      }

      console.log('✅ Auth user created or already exists:', authUser?.user?.id || userId);
    } catch (authError) {
      console.error('❌ Auth user creation failed:', authError);
      // 不要让auth用户创建失败阻止测试，继续尝试profile创建
    }

    // 确保用户profile存在
    
    const { data: existingProfile, error: checkProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    let profileData;
    if (checkProfileError && checkProfileError.code === 'PGRST116') {
      // 用户不存在，创建新用户
      console.log(`👤 Creating new user profile for ${userId}`);
      
      const { data: newProfile, error: createError } = await adminSupabase
        .from('profiles')
        .insert({
          id: userId,
          email: `${userId}@test.example.com`,
          name: `Test User ${userId.substring(0, 8)}`,
          customer_id: checkoutId,
          has_access: true,
          created_at: timeString,
          updated_at: timeString,
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating user profile:', createError);
        throw new Error(`Failed to create user profile: ${createError.message}`);
      }
      
      profileData = newProfile;
    } else if (checkProfileError) {
      console.error('❌ Error checking user profile:', checkProfileError);
      throw new Error(`Failed to check user profile: ${checkProfileError.message}`);
    } else {
      // 用户已存在，更新信息
      console.log(`👤 Updating existing user profile for ${userId}`);
      
      const { data: updatedProfile, error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          customer_id: checkoutId,
          has_access: true,
          updated_at: timeString,
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating user profile:', updateError);
        throw new Error(`Failed to update user profile: ${updateError.message}`);
      }
      
      profileData = updatedProfile;
    }

    console.log('✅ User profile processed:', profileData);

    // 创建订阅记录
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (planType === 'onetime') {
      endDate.setFullYear(endDate.getFullYear() + 10);
    }

    const { data: subscriptionData, error: subscriptionError } = await adminSupabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planType,
        plan_name: planType,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        creem_subscription_id: subscriptionId,
        credits: credits,
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString(),
      })
      .select();

    if (subscriptionError) {
      console.error('❌ Error creating subscription:', subscriptionError);
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }

    console.log('✅ Subscription created:', subscriptionData);

    // 创建订单记录
    const { data: orderData, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: orderId,
        product_id: planId,
        product_name: `${planType} subscription`,
        plan_type: planType,
        amount: null,
        status: 'completed',
        checkout_id: checkoutId,
        subscription_id: subscriptionId,
        credits_granted: credits,
        payment_date: startDate.toISOString(),
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString(),
      })
      .select();

    if (orderError) {
      console.error('❌ Error creating order record:', orderError);
    } else {
      console.log('✅ Order record created:', orderData);
    }

    // 添加积分记录
    const transactionNo = generateTransactionNo();
    
    let expiredAt = null;
    if (planType === 'monthly') {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(0, 0, 0, 0);
      expiredAt = nextMonth.toISOString();
    }
    
    const currentCredits = profileData?.current_credits || 0;
    
    // 同时更新credits表和profiles表
    const [creditsResult, profileUpdateResult] = await Promise.all([
      adminSupabase
        .from('credits')
        .insert({
          user_uuid: userId,
          trans_type: 'purchase',
          trans_no: transactionNo,
          order_no: orderId,
          credits: credits,
          expired_at: expiredAt,
          created_at: new Date().toISOString()
        }),
      adminSupabase
        .from('profiles')
        .update({
          current_credits: currentCredits + credits,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    ]);

    if (creditsResult.error) {
      console.error('❌ Error adding credits record:', creditsResult.error);
      throw new Error(`Failed to add credits record: ${creditsResult.error.message}`);
    }

    if (profileUpdateResult.error) {
      console.error('❌ Error updating profile credits:', profileUpdateResult.error);
      throw new Error(`Failed to update profile credits: ${profileUpdateResult.error.message}`);
    }

    console.log(`✅ Credits added: ${credits} credits for user ${userId}, transaction: ${transactionNo}`);

    return { 
      success: true, 
      subscriptionCreated: true, 
      creditsAdded: credits,
      transactionNo: transactionNo,
      profile: profileData,
      subscription: subscriptionData,
      order: orderData
    };

  } catch (error) {
    console.error('❌ Error in simulatePaymentSuccess:', error);
    throw error;
  }
}

// 获取数据反馈
async function getDataFeedback(userId: string, orderId: string) {
  console.log(`📊 Getting data feedback for user ${userId}, order ${orderId}`);
  
  try {
    // 查询用户信息
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    }

    // 查询积分记录
    const { data: credits, error: creditsError } = await adminSupabase
      .from('credits')
      .select('*')
      .eq('user_uuid', userId)
      .order('created_at', { ascending: false });

    if (creditsError) {
      console.error('❌ Error fetching credits:', creditsError);
    }

    // 查询订阅记录
    const { data: subscriptions, error: subscriptionsError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      console.error('❌ Error fetching subscriptions:', subscriptionsError);
    }

    // 查询订单记录
    const { data: orders, error: ordersError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
    }

    // 计算统计信息
    const totalCredits = credits?.reduce((sum, credit) => sum + credit.credits, 0) || 0;
    const activeSubscriptions = subscriptions?.filter(sub => sub.status === 'active') || [];
    const completedOrders = orders?.filter(order => order.status === 'completed') || [];

    return {
      profile: profile || null,
      credits: credits || [],
      subscriptions: subscriptions || [],
      orders: orders || [],
      statistics: {
        totalCredits,
        currentCredits: profile?.current_credits || 0,
        activeSubscriptions: activeSubscriptions.length,
        completedOrders: completedOrders.length,
        lastTransaction: credits?.[0]?.created_at || null
      }
    };

  } catch (error) {
    console.error('❌ Error getting data feedback:', error);
    throw error;
  }
} 