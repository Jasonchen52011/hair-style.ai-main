import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProductCreditsMap, getProductPlanMap } from '../../../../config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

//用户取消和续费

// 从配置文件获取产品映射
const PRODUCT_CREDITS_MAP = getProductCreditsMap();
const PRODUCT_PLAN_MAP = getProductPlanMap();

// 积分交易类型
const TRANS_TYPE = {
  PURCHASE: 'purchase',
  MONTHLY_DISTRIBUTION: 'monthly_distribution'
} as const;

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

// 生成fallback的order_no
function generateFallbackOrderNo(
  orderId: string | null,
  prefix: string,
  subscriptionId?: string | null,
  checkoutId?: string | null
): string {
  if (orderId) {
    return orderId;
  }
  
  // 按优先级选择fallback值
  const fallbackValue = subscriptionId || checkoutId || Date.now().toString();
  return `${prefix}_${fallbackValue}`;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    console.log(`🔔 Webhook received at ${new Date().toISOString()}`);
    
    // 基础安全验证
    const userAgent = req.headers.get('user-agent') || '';
    const contentType = req.headers.get('content-type') || '';
    
    // 验证Content-Type
    if (!contentType.includes('application/json')) {
      console.warn('❌ Invalid Content-Type:', contentType);
      return NextResponse.json({ error: 'Invalid Content-Type' }, { status: 400 });
    }
    
    // 验证User-Agent（Creem webhook应该有特定的User-Agent）
    if (userAgent && !userAgent.toLowerCase().includes('creem') && !userAgent.toLowerCase().includes('webhook')) {
      console.warn('⚠️ Suspicious User-Agent:', userAgent);
      // 注意：这里只是警告，不拒绝请求，因为User-Agent可能变化
    }
    
    const body = await req.json();
    console.log('📦 Webhook body:', JSON.stringify(body, null, 2));

    // 验证必要的数据 - 根据Creem文档调整
    const { eventType, object } = body;
    if (!eventType || !object) {
      console.error('❌ Missing eventType or object in webhook body');
      return NextResponse.json({ error: 'Missing eventType or object' }, { status: 400 });
    }

        // 提取关键信息 - 根据Creem文档精确提取数据
    let userId, planId, subscriptionId, orderId, checkoutId;
    
    switch (eventType) {
      case 'checkout.completed':
        // 从checkout.completed事件的object中提取
        userId = object.customer?.id;
        planId = object.product?.id;
        subscriptionId = object.subscription?.id;
        orderId = object.order?.id;
        checkoutId = object.id;
        break;
      
      case 'subscription.active':
        // subscription.active事件只有subscription对象，没有order或checkout
        userId = object.customer?.id;
        planId = object.product?.id;
        subscriptionId = object.id;
        orderId = null; // subscription.active没有order字段
        checkoutId = null; // subscription.active没有checkout字段
        break;
      
      case 'subscription.paid':
        // subscription.paid事件包含order和checkout
        userId = object.customer?.id;
        planId = object.product?.id;
        subscriptionId = object.id;
        orderId = object.order?.id;
        checkoutId = object.checkout?.id;
        break;
      
      case 'subscription.update':
        // subscription.update事件只有subscription对象，没有order或checkout
        userId = object.customer?.id;
        planId = object.product?.id;
        subscriptionId = object.id;
        orderId = null; // subscription.update没有order字段
        checkoutId = null; // subscription.update没有checkout字段
        break;
      
      case 'subscription.trialing':
        // subscription.trialing事件只有subscription对象，没有order或checkout
        userId = object.customer?.id;
        planId = object.product?.id;
        subscriptionId = object.id;
        orderId = null; // subscription.trialing没有order字段
        checkoutId = null; // subscription.trialing没有checkout字段
        break;
      
      case 'subscription.cancelled':
      case 'subscription.expired':
        // 注意：这些事件类型在Creem文档中没有提供示例
        // 假设结构与其他subscription事件类似
        userId = object.customer?.id;
        planId = object.product?.id;
        subscriptionId = object.id;
        orderId = null;
        checkoutId = null;
        break;
      
      case 'refund.created':
      case 'dispute.created':
        // 注意：这些事件类型在Creem文档中提到但没有提供示例
        // 根据常见的事件结构推测字段位置
        userId = object.customer?.id;
        planId = object.product?.id;
        subscriptionId = object.subscription?.id;
        orderId = object.order?.id;
        checkoutId = object.checkout?.id;
        break;
      
      default:
        console.warn(`⚠️ Unhandled event type: ${eventType}`);
        return NextResponse.json({ 
          message: `Event type ${eventType} acknowledged but not processed` 
        }, { status: 200 });
    }

    console.log(`📊 Extracted data:`, {
      eventType,
      userId,
      planId,
      subscriptionId,
      orderId,
      checkoutId
    });

    // 验证必要字段
    if (!userId || !planId) {
      console.error('❌ Missing required fields:', { userId, planId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 验证产品ID是否有效
    if (!PRODUCT_CREDITS_MAP[planId]) {
      console.error(`❌ Invalid product_id: ${planId}`);
      return NextResponse.json({ error: 'Invalid product_id' }, { status: 400 });
    }

    // 🔒 强化的幂等性检查 - 检查是否已经处理过这个订单
    if (orderId) {
      try {
        const subscriptionIdentifier = subscriptionId || `onetime_${orderId}`;
        
        // 检查1: 基于order_id的积分记录是否存在（最强的幂等性保护）
        const { data: existingCredit, error: creditCheckError } = await supabase
          .from('credits')
          .select('trans_no, credits, created_at')
          .eq('user_uuid', userId)
          .eq('order_no', orderId)
          .eq('trans_type', 'purchase')
          .single();

        if (creditCheckError && creditCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking existing credit:', creditCheckError);
        }

        if (existingCredit) {
          console.log(`✅ Order ${orderId} already processed for user ${userId} (credit exists)`, existingCredit);
          return NextResponse.json({ 
            message: 'Order already processed - credit exists',
            orderId,
            alreadyProcessed: true,
            existingCredit: existingCredit
          }, { status: 200 });
        }

        // 检查2: 订阅记录是否存在
        const { data: existingSubscription, error: checkError } = await supabase
          .from('subscriptions')
          .select('creem_subscription_id, created_at')
          .eq('user_id', userId)
          .eq('creem_subscription_id', subscriptionIdentifier)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Error checking existing subscription:', checkError);
        }

        if (existingSubscription) {
          console.log(`✅ Order ${orderId} already processed for user ${userId} (subscription exists)`, existingSubscription);
          return NextResponse.json({ 
            message: 'Order already processed - subscription exists',
            orderId,
            alreadyProcessed: true,
            existingSubscription: existingSubscription
          }, { status: 200 });
        }

        // 检查3: 订单记录是否存在
        const { data: existingOrder, error: orderCheckError } = await supabase
          .from('orders')
          .select('order_id, status, created_at')
          .eq('user_id', userId)
          .eq('order_id', orderId)
          .eq('status', 'completed')
          .single();

        if (orderCheckError && orderCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking existing order:', orderCheckError);
        }

        if (existingOrder) {
          console.log(`✅ Order ${orderId} already processed for user ${userId} (order exists)`, existingOrder);
          return NextResponse.json({ 
            message: 'Order already processed - order exists',
            orderId,
            alreadyProcessed: true,
            existingOrder: existingOrder
          }, { status: 200 });
        }

      } catch (error) {
        console.error('❌ Error in idempotency check:', error);
      }
    }

    // 根据事件类型处理
    let result;
    switch (eventType) {
      case 'checkout.completed':
        // checkout.completed 意味着结账完成，包含订单和订阅信息
        result = await handlePaymentSuccessWithConflictHandling(userId, planId, subscriptionId, orderId, checkoutId);
        break;
      
      case 'subscription.active':
        // subscription.active 意味着订阅激活，通常是首次创建
        result = await handlePaymentSuccessWithConflictHandling(userId, planId, subscriptionId, orderId, checkoutId);
        break;
      
      case 'subscription.paid':
        // subscription.paid 意味着订阅付款成功，包含订单信息
        result = await handlePaymentSuccessWithConflictHandling(userId, planId, subscriptionId, orderId, checkoutId);
        break;
      
      case 'subscription.cancelled':
      case 'subscription.expired':
        // 订阅取消或过期
        result = await handleSubscriptionCancelled(userId, subscriptionId);
        break;
      
      case 'subscription.update':
        // 订阅更新（计划变更等）
        result = await handleSubscriptionUpdated(userId, planId, subscriptionId, object);
        break;
      
      case 'subscription.trialing':
        // 订阅试用期开始
        result = await handleSubscriptionTrialing(userId, planId, subscriptionId, object);
        break;
      
      case 'refund.created':
        // 退款创建
        result = await handleRefundCreated(userId, planId, subscriptionId, orderId, object);
        break;
      
      case 'dispute.created':
        // 争议创建
        result = await handleDisputeCreated(userId, planId, subscriptionId, orderId, object);
        break;
      
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed successfully in ${processingTime}ms:`, result);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      processingTime: `${processingTime}ms`,
      result
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Webhook processing failed after ${processingTime}ms:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}

// 新的处理函数，集成冲突处理逻辑
async function handlePaymentSuccessWithConflictHandling(
  userId: string,
  planId: string,
  subscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null
) {
  console.log(`🎉 Processing payment success with conflict handling for user ${userId}, plan ${planId}`);

  try {
    // 确保用户profile存在
    await ensureUserProfile(userId, checkoutId);

    // 🔍 检查是否为续费：查看用户是否已有相同类型的活跃订阅
    const newPlanType = PRODUCT_PLAN_MAP[planId];
    
    if (newPlanType === 'monthly') {
      // 检查是否已有月度订阅
      const { data: existingMonthlySubscriptions, error: monthlyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_name', 'monthly')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());

      if (monthlyError) {
        console.error('❌ Error checking existing monthly subscriptions:', monthlyError);
        throw new Error(`Failed to check existing subscriptions: ${monthlyError.message}`);
      }

      if (existingMonthlySubscriptions && existingMonthlySubscriptions.length > 0) {
        console.log(`🔄 Detected monthly subscription renewal for user ${userId}`);
        // 这是续费，应该由定时任务处理，webhook不处理
        return {
          success: true,
          isRenewal: true,
          message: 'Monthly subscription renewal detected, will be handled by scheduled task',
          skipWebhookProcessing: true
        };
      }
    } else if (newPlanType === 'yearly') {
      // 检查是否已有年度订阅
      const { data: existingYearlySubscriptions, error: yearlyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_name', 'yearly')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());

      if (yearlyError) {
        console.error('❌ Error checking existing yearly subscriptions:', yearlyError);
        throw new Error(`Failed to check existing subscriptions: ${yearlyError.message}`);
      }

      if (existingYearlySubscriptions && existingYearlySubscriptions.length > 0) {
        console.log(`🔄 Detected yearly subscription renewal for user ${userId}`);
        // 年度订阅续费，应该由定时任务处理
        return {
          success: true,
          isRenewal: true,
          message: 'Yearly subscription renewal detected, will be handled by scheduled task',
          skipWebhookProcessing: true
        };
      }
    }

    // 检查订阅冲突（升级/降级场景）
    const { data: currentSubscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .in('plan_name', ['monthly', 'yearly']);

    if (subscriptionError) {
      console.error('❌ Error fetching current subscriptions:', subscriptionError);
      throw new Error(`Failed to fetch current subscriptions: ${subscriptionError.message}`);
    }

    const hasActiveSubscription = currentSubscriptions && currentSubscriptions.length > 0;

    if (hasActiveSubscription && newPlanType !== 'onetime') {
      const currentSubscription = currentSubscriptions[0];
      const currentPlanType = currentSubscription.plan_name;

      // 检查是否需要处理升级/降级
      const isUpgrade = (currentPlanType === 'monthly' && newPlanType === 'yearly');
      const isDowngrade = (currentPlanType === 'yearly' && newPlanType === 'monthly');

      if (isUpgrade || isDowngrade) {
        console.log(`📋 Handling subscription ${isUpgrade ? 'upgrade' : 'downgrade'} for user ${userId}`);
        
        // 使用本地冲突处理逻辑（避免内部HTTP调用）
        if (isUpgrade) {
          return await handleUpgradeLogic(userId, currentSubscription, planId, subscriptionId, orderId, checkoutId);
        } else {
          return await handleDowngradeLogic(userId, currentSubscription, planId, subscriptionId, orderId, checkoutId);
        }
      }
    }

    // 如果没有冲突且不是续费，处理为新订阅
    console.log(`🆕 Processing new ${newPlanType} subscription for user ${userId}`);
    return await handlePaymentSuccess(userId, planId, subscriptionId, orderId, checkoutId);

  } catch (error) {
    console.error('❌ Error in handlePaymentSuccessWithConflictHandling:', error);
    throw error;
  }
}

// 处理升级逻辑
async function handleUpgradeLogic(
  userId: string,
  currentSubscription: any,
  newPlanId: string,
  newSubscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null
) {
  console.log(`⬆️ Processing upgrade from monthly to yearly for user ${userId}`);

  try {
    // 1. 获取用户当前积分
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    const currentCredits = profile?.current_credits || 0;

    // 2. 立即取消当前月度订阅
    const { error: cancelError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSubscription.id);

    if (cancelError) {
      throw new Error(`Failed to cancel current subscription: ${cancelError.message}`);
    }

    // 3. 创建新的年度订阅
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const { data: newSubscriptionData, error: newSubscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: 'yearly',
        plan_name: 'yearly',
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        creem_subscription_id: newSubscriptionId || `yearly_${orderId}`,
        credits: PRODUCT_CREDITS_MAP[newPlanId],
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString(),
      })
      .select()
      .single();

    if (newSubscriptionError) {
      throw new Error(`Failed to create new subscription: ${newSubscriptionError.message}`);
    }

    // 4. 添加年度订阅的积分（立即发放1000积分）
    const transactionNo = generateTransactionNo();
    const creditsToAdd = PRODUCT_CREDITS_MAP[newPlanId];
    
    // 同时更新credits表和profiles表
    const [creditResult, profileResult] = await Promise.all([
      supabase
        .from('credits')
        .insert({
          user_uuid: userId,
          trans_type: TRANS_TYPE.PURCHASE,
          trans_no: transactionNo,
          order_no: generateFallbackOrderNo(orderId, 'upgrade', newSubscriptionId, checkoutId),
          credits: creditsToAdd, // 年度订阅立即获得1000积分
          expired_at: null, // 年度订阅积分通过月度分配管理
          created_at: new Date().toISOString()
        }),
      supabase
        .from('profiles')
        .update({
          current_credits: currentCredits + creditsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    ]);

    if (creditResult.error) {
      // 🔒 检查是否为数据库约束违反错误（重复插入）
      if (creditResult.error.code === '23505' && creditResult.error.message.includes('unique_user_order')) {
        console.log(`✅ Credits already exist for upgrade order ${orderId}, skipping duplicate insertion`);
        return {
          success: true,
          conflictHandled: true,
          transitionType: 'upgrade',
          creditsAdded: 0,
          message: 'Credits already exist - duplicate prevented by database constraint',
          alreadyProcessed: true
        };
      }
      throw new Error(`Failed to add credits record: ${creditResult.error.message}`);
    }

    if (profileResult.error) {
      throw new Error(`Failed to update profile credits: ${profileResult.error.message}`);
    }

    // 5. 创建升级订单记录
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: orderId || `upgrade_${newSubscriptionId}`,
        product_id: newPlanId,
        product_name: 'Yearly subscription (upgrade)',
        plan_type: 'yearly',
        amount: null,
        status: 'completed',
        checkout_id: checkoutId,
        subscription_id: newSubscriptionId,
        credits_granted: PRODUCT_CREDITS_MAP[newPlanId],
        payment_date: new Date().toISOString(),
      })
      .select();

    if (orderError) {
      console.error('❌ Error creating upgrade order record:', orderError);
    } else {
      console.log('✅ Upgrade order record created:', orderData);
    }

    console.log(`✅ Upgrade completed: ${currentCredits} existing credits + ${PRODUCT_CREDITS_MAP[newPlanId]} new credits`);

    return {
      success: true,
      conflictHandled: true,
      transitionType: 'upgrade',
      subscriptionData: newSubscriptionData,
      creditsAdded: PRODUCT_CREDITS_MAP[newPlanId],
      totalCredits: currentCredits + PRODUCT_CREDITS_MAP[newPlanId],
      transactionNo: transactionNo
    };

  } catch (error) {
    console.error('❌ Error in upgrade process:', error);
    throw error;
  }
}

// 处理降级逻辑
async function handleDowngradeLogic(
  userId: string,
  currentSubscription: any,
  newPlanId: string,
  newSubscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null
) {
  console.log(`⬇️ Processing downgrade from yearly to monthly for user ${userId}`);

  try {
    // 1. 获取用户当前积分
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    const currentCredits = profile?.current_credits || 0;

    // 2. 创建待激活的月度订阅（在年度订阅结束后生效）
    const currentEndDate = new Date(currentSubscription.end_date);
    const monthlyStartDate = new Date(currentEndDate.getTime() + 24 * 60 * 60 * 1000); // 年度订阅结束后一天
    const monthlyEndDate = new Date(monthlyStartDate);
    monthlyEndDate.setMonth(monthlyEndDate.getMonth() + 1);

    const { data: newSubscriptionData, error: newSubscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: 'monthly',
        plan_name: 'monthly',
        status: 'pending', // 待激活状态
        start_date: monthlyStartDate.toISOString(),
        end_date: monthlyEndDate.toISOString(),
        creem_subscription_id: newSubscriptionId || `monthly_${orderId}`,
        credits: PRODUCT_CREDITS_MAP[newPlanId],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (newSubscriptionError) {
      throw new Error(`Failed to create pending subscription: ${newSubscriptionError.message}`);
    }

    // 3. 标记当前年度订阅为"即将取消"（不立即取消）
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'expiring', // 自定义状态，表示即将过期
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSubscription.id);

    if (updateError) {
      throw new Error(`Failed to update current subscription: ${updateError.message}`);
    }

    // 4. 创建降级订单记录
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: orderId || `downgrade_${newSubscriptionId}`,
        product_id: newPlanId,
        product_name: 'Monthly subscription (downgrade)',
        plan_type: 'monthly',
        amount: null,
        status: 'completed',
        checkout_id: checkoutId,
        subscription_id: newSubscriptionId,
        credits_granted: 0, // 降级不立即给积分
        payment_date: new Date().toISOString(),
      })
      .select();

    if (orderError) {
      console.error('❌ Error creating downgrade order record:', orderError);
    } else {
      console.log('✅ Downgrade order record created:', orderData);
    }

    // 5. 记录降级交易（不添加积分，因为年度订阅积分保留到过期）
    const transactionNo = generateTransactionNo();
    const { error: recordError } = await supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: 'transfer',
        trans_no: transactionNo,
        order_no: generateFallbackOrderNo(orderId, 'downgrade', newSubscriptionId, checkoutId),
        credits: 0, // 不添加积分
        expired_at: null,
        created_at: new Date().toISOString()
      });

    if (recordError) {
      console.error('Warning: Failed to record downgrade transaction:', recordError);
    }

    console.log(`✅ Downgrade scheduled: Current credits ${currentCredits} will be preserved until ${currentEndDate.toISOString()}`);

    return {
      success: true,
      conflictHandled: true,
      transitionType: 'downgrade',
      subscriptionData: newSubscriptionData,
      creditsAdded: 0,
      totalCredits: currentCredits,
      transactionNo: transactionNo
    };

  } catch (error) {
    console.error('❌ Error in downgrade process:', error);
    throw error;
  }
}

// 抽取用户profile处理逻辑
async function ensureUserProfile(userId: string, checkoutId: string | null) {
  const now = new Date();
  const timeString = now.toISOString();
  
  // 首先检查用户是否已存在
  const { data: existingProfile, error: checkProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (checkProfileError && checkProfileError.code === 'PGRST116') {
    // 用户不存在，先创建auth用户，然后创建profile
    console.log(`👤 Creating new auth user and profile for ${userId}`);
    
    // 创建auth用户
    try {
      const { data: authUser, error: authUserError } = await supabase.auth.admin.createUser({
        id: userId,
        email: `user_${userId.substring(0, 8)}@hairsystem.temp`,
        password: 'temp-password-123',
        email_confirm: true,
        user_metadata: {
          full_name: `User ${userId.substring(0, 8)}`,
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
      // 不要让auth用户创建失败阻止整个流程，继续尝试profile创建
    }
    
    // 创建profile，使用 upsert 避免重复键错误
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: `user_${userId.substring(0, 8)}@hairsystem.temp`, // 临时邮箱，后续可更新
        name: `User ${userId.substring(0, 8)}`,
        customer_id: checkoutId,
        has_access: true,
        created_at: timeString,
        updated_at: timeString,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating/updating user profile:', createError);
      throw new Error(`Failed to create/update user profile: ${createError.message}`);
    }
    
    console.log('✅ User profile created/updated:', newProfile);
  } else if (checkProfileError) {
    console.error('❌ Error checking user profile:', checkProfileError);
    throw new Error(`Failed to check user profile: ${checkProfileError.message}`);
  } else {
    // 用户已存在，更新信息
    console.log(`👤 Updating existing user profile for ${userId}`);
    
    const { data: updatedProfile, error: updateError } = await supabase
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
    
    console.log('✅ User profile updated:', updatedProfile);
  }
}

async function handlePaymentSuccess(
  userId: string, 
  planId: string, 
  subscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null
) {
  console.log(`🎉 Processing payment success for user ${userId}, plan ${planId}`);

  // 获取对应的credits数量
  const credits = PRODUCT_CREDITS_MAP[planId] || 0;
  const planType = PRODUCT_PLAN_MAP[planId] || 'onetime';

  console.log(`💰 Credits to add: ${credits}, Plan type: ${planType}`);

  try {
    // 获取用户profile（假设已经通过ensureUserProfile创建）
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    console.log('✅ User profile fetched:', profileData);

    // 处理订阅记录（包括一次性购买）
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (planType === 'onetime') {
      // 一次性购买设置为很长的有效期（10年）
      endDate.setFullYear(endDate.getFullYear() + 10);
    }

    console.log(`📅 Subscription dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 创建订阅记录（所有购买类型都创建订阅）
    const subscriptionIdentifier = subscriptionId || `onetime_${orderId}`;

    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planType,
        plan_name: planType,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        creem_subscription_id: subscriptionIdentifier,
        credits: credits, // 在订阅表中也记录积分信息，方便查看
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
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: orderId || `auto_${subscriptionIdentifier}`,
        product_id: planId,
        product_name: `${planType} subscription`,
        plan_type: planType,
        amount: null, // 从Creem获取实际金额
        status: 'completed',
        checkout_id: checkoutId,
        subscription_id: subscriptionIdentifier,
        credits_granted: credits,
        payment_date: startDate.toISOString(),
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString(),
      })
      .select();

    if (orderError) {
      console.error('❌ Error creating order record:', orderError);
      // 不让订单记录失败影响主流程，但要记录错误
    } else {
      console.log('✅ Order record created:', orderData);
    }

    // 在credits表中添加积分记录
    const transactionNo = generateTransactionNo();
    
    // 根据套餐类型设置过期时间
    let expiredAt = null;
    if (planType === 'onetime') {
      // 一次性购买：根据用户的订阅类型设置过期时间
      try {
        // 查询用户的活跃订阅（月度或年度）
        const { data: activeSubscriptions, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('end_date, plan_name')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .in('plan_name', ['monthly', 'yearly'])
          .order('end_date', { ascending: false }) // 获取最晚过期的订阅
          .limit(1);

        if (subscriptionError) {
          console.error('❌ Error fetching user subscriptions for credit expiration:', subscriptionError);
          // 回退到原有逻辑
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          nextMonth.setHours(0, 0, 0, 0);
          expiredAt = nextMonth.toISOString();
        } else if (activeSubscriptions && activeSubscriptions.length > 0) {
          const userSubscription = activeSubscriptions[0];
          
          if (userSubscription.plan_name === 'monthly') {
            // 月度订阅用户：积分跟随月度订阅过期
            expiredAt = userSubscription.end_date;
            console.log(`✅ One-time purchase credits will expire with monthly subscription: ${expiredAt}`);
          } else if (userSubscription.plan_name === 'yearly') {
            // 年度订阅用户：积分跟随每月发放积分的时间过期（下个月同一日期）
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setHours(0, 0, 0, 0);
            expiredAt = nextMonth.toISOString();
            console.log(`✅ One-time purchase credits for yearly subscriber will expire with monthly distribution: ${expiredAt}`);
          }
        } else {
          // 没有活跃订阅，使用默认逻辑（理论上不应该发生，因为购买一次性积分需要有活跃订阅）
          console.warn('⚠️  No active subscription found for one-time purchase, using default expiration');
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          nextMonth.setHours(0, 0, 0, 0);
          expiredAt = nextMonth.toISOString();
        }
      } catch (error) {
        console.error('❌ Error setting onetime credit expiration:', error);
        // 回退到原有逻辑
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        expiredAt = nextMonth.toISOString();
      }
    } else if (planType === 'monthly') {
      // 月度订阅：下个月的订阅日期清零
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(0, 0, 0, 0);
      expiredAt = nextMonth.toISOString();
    }
    // 年度订阅积分通过月度分配，这里不设置过期时间
    
    // 获取当前积分
    const currentCredits = profileData?.current_credits || 0;

    // 同时更新credits表和profiles表
    const [creditsResult, profileUpdateResult] = await Promise.all([
      supabase
        .from('credits')
        .insert({
          user_uuid: userId,
          trans_type: TRANS_TYPE.PURCHASE,
          trans_no: transactionNo,
          order_no: generateFallbackOrderNo(orderId, 'payment', subscriptionId, checkoutId),
          credits: credits, // 正数表示获得积分
          expired_at: expiredAt,
          created_at: new Date().toISOString()
        }),
      supabase
        .from('profiles')
        .update({
          current_credits: currentCredits + credits,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    ]);

    if (creditsResult.error) {
      // 🔒 检查是否为数据库约束违反错误（重复插入）
      if (creditsResult.error.code === '23505' && creditsResult.error.message.includes('unique_user_order')) {
        console.log(`✅ Credits already exist for order ${orderId}, skipping duplicate insertion`);
        return { 
          success: true, 
          subscriptionCreated: true, 
          creditsAdded: 0,
          message: 'Credits already exist - duplicate prevented by database constraint',
          alreadyProcessed: true
        };
      }
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
      data: subscriptionData 
    };

  } catch (error) {
    console.error('❌ Error in handlePaymentSuccess:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(userId: string, subscriptionId: string) {
  console.log(`🚫 Processing subscription cancellation for user ${userId}, subscription ${subscriptionId}`);

  if (!subscriptionId) {
    console.error('❌ Missing subscription_id for cancellation');
    return { error: 'Missing subscription_id' };
  }

  try {
    const { data: cancelledData, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
      })
      .eq('user_id', userId)
      .eq('creem_subscription_id', subscriptionId) // 使用正确的字段名
      .select();

    if (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }

    console.log('✅ Subscription cancelled:', cancelledData);
    return { cancelled: true, data: cancelledData };

  } catch (error) {
    console.error('❌ Error in handleSubscriptionCancelled:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(
  userId: string, 
  planId: string, 
  subscriptionId: string,
  data: any
) {
  console.log(`🔄 Processing subscription update for user ${userId}, subscription ${subscriptionId}`);

  if (!subscriptionId) {
    console.error('❌ Missing subscription_id for update');
    return { error: 'Missing subscription_id' };
  }

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const planType = PRODUCT_PLAN_MAP[planId] || 'onetime';
    
    // 根据更新的数据计算新的结束日期
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const { data: updatedData, error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planType,
        plan_name: planType, // 添加计划名称
        status: data.status || 'active',
        credits: credits, // 直接使用数字，不转换为字符串
        end_date: endDate.toISOString(),
      })
      .eq('user_id', userId)
      .eq('creem_subscription_id', subscriptionId) // 使用正确的字段名
      .select();

    if (error) {
      console.error('❌ Error updating subscription:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    console.log('✅ Subscription updated:', updatedData);
    return { updated: true, data: updatedData };

  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}

async function handleSubscriptionTrialing(
  userId: string, 
  planId: string, 
  subscriptionId: string,
  data: any
) {
  console.log(`🔄 Processing subscription trial for user ${userId}, subscription ${subscriptionId}`);

  if (!subscriptionId) {
    console.error('❌ Missing subscription_id for trial');
    return { error: 'Missing subscription_id' };
  }

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const planType = PRODUCT_PLAN_MAP[planId] || 'onetime';
    
    // 试用期通常不计算结束日期，使用试用期间
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const { data: updatedData, error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planType,
        plan_name: planType,
        status: 'trialing',
        credits: credits,
        end_date: endDate.toISOString(),
      })
      .eq('user_id', userId)
      .eq('creem_subscription_id', subscriptionId)
      .select();

    if (error) {
      console.error('❌ Error updating subscription to trialing:', error);
      throw new Error(`Failed to update subscription to trialing: ${error.message}`);
    }

    console.log('✅ Subscription trial updated:', updatedData);
    return { trialing: true, data: updatedData };

  } catch (error) {
    console.error('❌ Error in handleSubscriptionTrialing:', error);
    throw error;
  }
}

async function handleRefundCreated(
  userId: string,
  planId: string,
  subscriptionId: string | null,
  orderId: string | null,
  data: any
) {
  console.log(`💰 Processing refund created for user ${userId}, order ${orderId}`);

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const transactionNo = generateTransactionNo();

    // 记录退款事件
    const { error: refundError } = await supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: 'refund',
        trans_no: transactionNo,
        order_no: generateFallbackOrderNo(orderId, 'refund', subscriptionId, null),
        credits: -credits, // 负数表示扣除积分
        expired_at: null,
        created_at: new Date().toISOString()
      });

    if (refundError) {
      console.error('❌ Error recording refund:', refundError);
      throw new Error(`Failed to record refund: ${refundError.message}`);
    }

    // 如果有订阅，标记为已取消
    if (subscriptionId) {
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('creem_subscription_id', subscriptionId);

      if (subscriptionError) {
        console.error('❌ Error cancelling subscription for refund:', subscriptionError);
      }
    }

    console.log(`✅ Refund processed: ${credits} credits deducted from user ${userId}`);
    return { 
      refund: true, 
      creditsDeducted: credits,
      transactionNo: transactionNo 
    };

  } catch (error) {
    console.error('❌ Error in handleRefundCreated:', error);
    throw error;
  }
}

async function handleDisputeCreated(
  userId: string,
  planId: string,
  subscriptionId: string | null,
  orderId: string | null,
  data: any
) {
  console.log(`⚠️ Processing dispute created for user ${userId}, order ${orderId}`);

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const transactionNo = generateTransactionNo();

    // 记录争议事件
    const { error: disputeError } = await supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: 'dispute',
        trans_no: transactionNo,
        order_no: generateFallbackOrderNo(orderId, 'dispute', subscriptionId, null),
        credits: -credits, // 负数表示扣除积分
        expired_at: null,
        created_at: new Date().toISOString()
      });

    if (disputeError) {
      console.error('❌ Error recording dispute:', disputeError);
      throw new Error(`Failed to record dispute: ${disputeError.message}`);
    }

    // 如果有订阅，标记为争议中
    if (subscriptionId) {
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'disputed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('creem_subscription_id', subscriptionId);

      if (subscriptionError) {
        console.error('❌ Error marking subscription as disputed:', subscriptionError);
      }
    }

    console.log(`✅ Dispute processed: ${credits} credits deducted from user ${userId}`);
    return { 
      dispute: true, 
      creditsDeducted: credits,
      transactionNo: transactionNo 
    };

  } catch (error) {
    console.error('❌ Error in handleDisputeCreated:', error);
    throw error;
  }
}
