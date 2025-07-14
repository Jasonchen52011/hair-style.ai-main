import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProductCreditsMap, getProductPlanMap } from '../../../../config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_CREDITS_MAP = getProductCreditsMap();
const PRODUCT_PLAN_MAP = getProductPlanMap();

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

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Payment success callback received');
    
    const body = await request.json();
    console.log('📦 Payment callback body:', JSON.stringify(body, null, 2));

    // 提取关键信息
    const { 
      userId, 
      user_id, 
      planId, 
      product_id, 
      subscriptionId, 
      subscription_id,
      orderId, 
      order_id, 
      checkoutId, 
      checkout_id 
    } = body;

    // 统一变量名（支持多种可能的字段名）
    const finalUserId = userId || user_id;
    const finalPlanId = planId || product_id;
    const finalSubscriptionId = subscriptionId || subscription_id;
    const finalOrderId = orderId || order_id;
    const finalCheckoutId = checkoutId || checkout_id;

    // 验证必要字段
    if (!finalUserId || !finalPlanId) {
      console.error('❌ Missing required fields:', { finalUserId, finalPlanId });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields (userId, planId)' 
      }, { status: 400 });
    }

    // 验证产品ID是否有效
    if (!PRODUCT_CREDITS_MAP[finalPlanId]) {
      console.error(`❌ Invalid product_id: ${finalPlanId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid product_id' 
      }, { status: 400 });
    }

    // 🔒 强化的幂等性检查 - 多层级检查防止重复处理
    if (finalOrderId || finalCheckoutId) {
      const subscriptionIdentifier = finalSubscriptionId || `onetime_${finalOrderId}`;
      
      // 检查1: 基于order_id的积分记录是否存在（最强保护）
      if (finalOrderId) {
        const { data: existingCredit } = await supabase
          .from('credits')
          .select('trans_no, credits, created_at')
          .eq('user_uuid', finalUserId)
          .eq('order_no', finalOrderId)
          .eq('trans_type', 'purchase')
          .single();

        if (existingCredit) {
          console.log(`✅ Order ${finalOrderId} already processed for user ${finalUserId} (credit exists)`, existingCredit);
          return NextResponse.json({ 
            success: true,
            message: 'Order already processed - credit exists',
            alreadyProcessed: true,
            existingCredit: existingCredit
          }, { status: 200 });
        }
      }

      // 检查2: 基于order_id的订单记录是否存在
      if (finalOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('order_id, status, created_at')
          .eq('user_id', finalUserId)
          .eq('order_id', finalOrderId)
          .eq('status', 'completed')
          .single();

        if (existingOrder) {
          console.log(`✅ Order ${finalOrderId} already processed for user ${finalUserId} (order exists)`, existingOrder);
          return NextResponse.json({ 
            success: true,
            message: 'Order already processed - order exists',
            alreadyProcessed: true,
            existingOrder: existingOrder
          }, { status: 200 });
        }
      }

      // 检查3: 订阅记录是否存在
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('creem_subscription_id, created_at')
        .eq('user_id', finalUserId)
        .eq('creem_subscription_id', subscriptionIdentifier)
        .single();

      if (existingSubscription) {
        console.log(`✅ Order ${finalOrderId} already processed for user ${finalUserId} (subscription exists)`, existingSubscription);
        return NextResponse.json({ 
          success: true,
          message: 'Order already processed - subscription exists',
          alreadyProcessed: true,
          existingSubscription: existingSubscription
        }, { status: 200 });
      }

      // 检查4: 基于checkout_id的积分记录（额外保护）
      if (finalCheckoutId) {
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('order_id, status, created_at')
          .eq('user_id', finalUserId)
          .eq('checkout_id', finalCheckoutId)
          .eq('status', 'completed')
          .single();

        if (existingOrders) {
          console.log(`✅ Checkout ${finalCheckoutId} already processed for user ${finalUserId} (order exists)`, existingOrders);
          return NextResponse.json({ 
            success: true,
            message: 'Checkout already processed - order exists',
            alreadyProcessed: true,
            existingOrder: existingOrders
          }, { status: 200 });
        }

        // 检查5: 基于checkout_id的积分记录（通过orders表关联查询）
        const { data: ordersWithCheckoutId } = await supabase
          .from('orders')
          .select('order_id')
          .eq('user_id', finalUserId)
          .eq('checkout_id', finalCheckoutId);

        if (ordersWithCheckoutId && ordersWithCheckoutId.length > 0) {
          // 再查询credits表是否存在相应的记录
          const orderIds = ordersWithCheckoutId.map(order => order.order_id);
          const { data: existingCreditsFromCheckout } = await supabase
            .from('credits')
            .select('trans_no, credits, created_at')
            .eq('user_uuid', finalUserId)
            .in('order_no', orderIds)
            .limit(1);

          if (existingCreditsFromCheckout && existingCreditsFromCheckout.length > 0) {
            console.log(`✅ Credits already exist for checkout ${finalCheckoutId} for user ${finalUserId}`, existingCreditsFromCheckout);
            return NextResponse.json({ 
              success: true,
              message: 'Credits already exist for checkout',
              alreadyProcessed: true,
              existingCredits: existingCreditsFromCheckout
            }, { status: 200 });
          }
        }
      }

      // 检查6: 时间窗口内的重复处理（3分钟内相同产品的购买）
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const expectedCredits = PRODUCT_CREDITS_MAP[finalPlanId];
      
      const { data: recentCreditDetails } = await supabase
        .from('credits')
        .select('credits, created_at, trans_no')
        .eq('user_uuid', finalUserId)
        .eq('trans_type', 'purchase')
        .eq('credits', expectedCredits)
        .gte('created_at', threeMinutesAgo)
        .limit(1);

      if (recentCreditDetails && recentCreditDetails.length > 0) {
        console.log(`✅ Similar purchase detected within 3 minutes for user ${finalUserId}, likely duplicate`, recentCreditDetails);
        return NextResponse.json({ 
          success: true,
          message: 'Similar purchase detected recently - likely duplicate',
          alreadyProcessed: true,
          recentCredit: recentCreditDetails[0]
        }, { status: 200 });
      }
    }

    // 处理支付成功
    const result = await handlePaymentSuccess(
      finalUserId, 
      finalPlanId, 
      finalSubscriptionId, 
      finalOrderId, 
      finalCheckoutId
    );

    console.log('✅ Payment success callback processed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      result
    });

  } catch (error) {
    console.error('❌ Payment success callback processing failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Payment processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

  const credits = PRODUCT_CREDITS_MAP[planId] || 0;
  const planType = PRODUCT_PLAN_MAP[planId] || 'onetime';

  console.log(`💰 Credits to add: ${credits}, Plan type: ${planType}`);

  try {
    // 🔍 检查是否为续费：查看用户是否已有相同类型的活跃订阅
    if (planType === 'monthly') {
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
        // 这是续费，应该由定时任务处理，callback不处理
        return {
          success: true,
          isRenewal: true,
          message: 'Monthly subscription renewal detected, will be handled by scheduled task',
          skipCallbackProcessing: true
        };
      }
    } else if (planType === 'yearly') {
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
          skipCallbackProcessing: true
        };
      }
    }

    // 确保用户profile存在
    const now = new Date();
    const timeString = now.toISOString();
    
    const { data: existingProfile, error: checkProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    let profileData;
    if (checkProfileError && checkProfileError.code === 'PGRST116') {
      // 用户不存在，创建新用户
      console.log(`👤 Creating new user profile for ${userId}`);
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: `user_${userId.substring(0, 8)}@hairsystem.temp`,
          name: `User ${userId.substring(0, 8)}`,
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
      
      profileData = updatedProfile;
    }

    console.log('✅ User profile processed:', profileData);

    // 处理订阅记录
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (planType === 'onetime') {
      endDate.setFullYear(endDate.getFullYear() + 10);
    }

    // 创建订阅记录
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
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: orderId || `auto_${subscriptionIdentifier}`,
        product_id: planId,
        product_name: `${planType} subscription`,
        plan_type: planType,
        amount: null,
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
    } else {
      console.log('✅ Order record created:', orderData);
    }

    // 添加积分记录并更新用户current_credits
    const transactionNo = generateTransactionNo();
    
    let expiredAt = null;
    if (planType === 'monthly') {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(0, 0, 0, 0);
      expiredAt = nextMonth.toISOString();
    }
    
    // 获取当前积分
    const currentCredits = profileData?.current_credits || 0;
    
    // 🔧 修复：确保 order_no 不为空
    const orderNo = orderId || `fallback_${subscriptionId || checkoutId || Date.now()}`;
    
    // 同时更新credits表和profiles表
    const [creditsResult, profileUpdateResult] = await Promise.all([
      supabase
        .from('credits')
        .insert({
          user_uuid: userId,
          trans_type: TRANS_TYPE.PURCHASE,
          trans_no: transactionNo,
          order_no: orderNo,
          credits: credits,
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
        console.log(`✅ Credits already exist for order ${orderNo}, skipping duplicate insertion`);
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