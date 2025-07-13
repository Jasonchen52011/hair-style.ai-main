import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProductCreditsMap, getProductPlanMap } from '../../../../config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 从配置文件获取产品映射
const PRODUCT_PLAN_MAP = getProductPlanMap();
const PRODUCT_CREDITS_MAP = getProductCreditsMap();

// 积分交易类型
const TRANS_TYPE = {
  PURCHASE: 'purchase',
  MONTHLY_DISTRIBUTION: 'monthly_distribution',
  UPGRADE_BONUS: 'upgrade_bonus',
  TRANSFER: 'transfer'
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

export async function POST(request: NextRequest) {
  // 🚫 API已禁用 - 所有支付处理现在通过webhook进行
  console.log('🚫 Subscription conflict handler API is disabled. All payment processing is now handled through webhook.');
  
  return NextResponse.json({
    success: false,
    message: 'This API has been disabled. All payment processing is now handled through webhook.',
    disabled: true
  }, { status: 410 }); // 410 Gone - 资源已被永久移除

  /* 原有代码已禁用
  try {
    const { 
      userId, 
      newPlanId, 
      newSubscriptionId, 
      orderId, 
      checkoutId,
      action // 'upgrade' | 'downgrade' | 'check_conflict'
    } = await request.json();

    console.log(`🔄 Processing subscription conflict for user ${userId}, new plan: ${newPlanId}, action: ${action}`);

    if (!userId || !newPlanId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const newPlanType = PRODUCT_PLAN_MAP[newPlanId];
    if (!newPlanType) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // 检查用户当前的活跃订阅
    const { data: currentSubscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .in('plan_name', ['monthly', 'yearly']);

    if (subscriptionError) {
      console.error('❌ Error fetching current subscriptions:', subscriptionError);
      return NextResponse.json({ error: 'Failed to fetch current subscriptions' }, { status: 500 });
    }

    // 如果只是检查冲突，返回冲突信息
    if (action === 'check_conflict') {
      return await handleConflictCheck(currentSubscriptions, newPlanType);
    }

    // 处理升级/降级
    if (currentSubscriptions && currentSubscriptions.length > 0) {
      const currentSubscription = currentSubscriptions[0]; // 假设只有一个活跃订阅
      const currentPlanType = currentSubscription.plan_name;

      console.log(`📊 Current subscription: ${currentPlanType}, New subscription: ${newPlanType}`);

      // 判断是升级还是降级
      const isUpgrade = (currentPlanType === 'monthly' && newPlanType === 'yearly');
      const isDowngrade = (currentPlanType === 'yearly' && newPlanType === 'monthly');

      if (isUpgrade) {
        return await handleUpgrade(userId, currentSubscription, newPlanId, newSubscriptionId, orderId, checkoutId);
      } else if (isDowngrade) {
        return await handleDowngrade(userId, currentSubscription, newPlanId, newSubscriptionId, orderId, checkoutId);
      } else {
        return NextResponse.json({ error: 'Invalid subscription transition' }, { status: 400 });
      }
    } else {
      // 新用户，直接创建订阅
      return await handleNewSubscription(userId, newPlanId, newSubscriptionId, orderId, checkoutId);
    }

  } catch (error) {
    console.error('❌ Error in subscription conflict handler:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
  */
}

// 检查冲突
async function handleConflictCheck(currentSubscriptions: any[], newPlanType: string) {
  if (!currentSubscriptions || currentSubscriptions.length === 0) {
    return NextResponse.json({ 
      hasConflict: false,
      message: 'No active subscription found' 
    });
  }

  const currentSubscription = currentSubscriptions[0];
  const currentPlanType = currentSubscription.plan_name;

  const isUpgrade = (currentPlanType === 'monthly' && newPlanType === 'yearly');
  const isDowngrade = (currentPlanType === 'yearly' && newPlanType === 'monthly');

  return NextResponse.json({
    hasConflict: isUpgrade || isDowngrade,
    currentPlan: currentPlanType,
    newPlan: newPlanType,
    transitionType: isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'none',
    currentSubscription: currentSubscription
  });
}

// 处理升级（月转年）
async function handleUpgrade(
  userId: string,
  currentSubscription: any,
  newPlanId: string,
  newSubscriptionId: string,
  orderId: string,
  checkoutId: string
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
        creem_subscription_id: newSubscriptionId,
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
          created_at: new Date().toISOString(),
          event_type: 'subscription_upgrade'
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

    return NextResponse.json({
      success: true,
      message: 'Upgrade completed successfully',
      transitionType: 'upgrade',
      subscriptionData: newSubscriptionData,
      creditsAdded: PRODUCT_CREDITS_MAP[newPlanId],
      totalCredits: currentCredits + PRODUCT_CREDITS_MAP[newPlanId],
      transactionNo: transactionNo,
      effectiveDate: 'immediate'
    });

  } catch (error) {
    console.error('❌ Error in upgrade process:', error);
    throw error;
  }
}

// 处理降级（年转月）
async function handleDowngrade(
  userId: string,
  currentSubscription: any,
  newPlanId: string,
  newSubscriptionId: string,
  orderId: string,
  checkoutId: string
) {
  console.log(`⬇️ Processing downgrade from yearly to monthly for user ${userId}`);

  try {
    // 1. 获取用户当前积分
    const { data: creditRecords, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_uuid', userId)
      .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

    if (creditsError) {
      throw new Error(`Failed to fetch current credits: ${creditsError.message}`);
    }

    const currentCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

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
        creem_subscription_id: newSubscriptionId,
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

    // 4. 记录降级交易（不添加积分，因为年度订阅积分保留到过期）
    const transactionNo = generateTransactionNo();
    const { error: recordError } = await supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: TRANS_TYPE.TRANSFER,
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

    return NextResponse.json({
      success: true,
      message: 'Downgrade scheduled successfully',
      transitionType: 'downgrade',
      subscriptionData: newSubscriptionData,
      creditsAdded: 0,
      totalCredits: currentCredits,
      transactionNo: transactionNo,
      effectiveDate: monthlyStartDate.toISOString(),
      currentSubscriptionEndDate: currentEndDate.toISOString()
    });

  } catch (error) {
    console.error('❌ Error in downgrade process:', error);
    throw error;
  }
}

// 处理新订阅
async function handleNewSubscription(
  userId: string,
  newPlanId: string,
  newSubscriptionId: string,
  orderId: string,
  checkoutId: string
) {
  console.log(`🆕 Creating new subscription for user ${userId}`);

  const planType = PRODUCT_PLAN_MAP[newPlanId];
  const credits = PRODUCT_CREDITS_MAP[newPlanId];

  const startDate = new Date();
  const endDate = new Date(startDate);
  
  if (planType === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planType === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // 创建订阅
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planType,
      plan_name: planType,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      creem_subscription_id: newSubscriptionId,
      credits: credits,
      created_at: startDate.toISOString(),
      updated_at: startDate.toISOString(),
    })
    .select()
    .single();

  if (subscriptionError) {
    throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
  }

  // 添加积分
  const transactionNo = generateTransactionNo();
  let expiredAt = null;

  if (planType === 'monthly') {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(0, 0, 0, 0);
    expiredAt = nextMonth.toISOString();
  }

  // 获取当前积分
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_credits')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to fetch user profile: ${profileError.message}`);
  }

  const currentCredits = profile?.current_credits || 0;

  // 同时更新credits表和profiles表
  const [creditResult, profileResult] = await Promise.all([
    supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: TRANS_TYPE.PURCHASE,
        trans_no: transactionNo,
        order_no: generateFallbackOrderNo(orderId, 'new', newSubscriptionId, checkoutId),
        credits: credits,
        expired_at: expiredAt,
        created_at: new Date().toISOString(),
        event_type: 'new_subscription'
      }),
    supabase
      .from('profiles')
      .update({
        current_credits: currentCredits + credits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
  ]);

  if (creditResult.error) {
    throw new Error(`Failed to add credits record: ${creditResult.error.message}`);
  }

  if (profileResult.error) {
    throw new Error(`Failed to update profile credits: ${profileResult.error.message}`);
  }

  // 创建新订阅订单记录
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_id: orderId || `new_${newSubscriptionId}`,
      product_id: newPlanId,
      product_name: `${planType} subscription`,
      plan_type: planType,
      amount: null,
      status: 'completed',
      checkout_id: checkoutId,
      subscription_id: newSubscriptionId,
      credits_granted: credits,
      payment_date: new Date().toISOString(),
    })
    .select();

  if (orderError) {
    console.error('❌ Error creating new subscription order record:', orderError);
  } else {
    console.log('✅ New subscription order record created:', orderData);
  }

  return NextResponse.json({
    success: true,
    message: 'New subscription created successfully',
    transitionType: 'new',
    subscriptionData: subscriptionData,
    creditsAdded: credits,
    totalCredits: credits,
    transactionNo: transactionNo,
    effectiveDate: 'immediate'
  });
} 