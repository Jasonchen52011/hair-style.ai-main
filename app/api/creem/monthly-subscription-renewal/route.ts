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
  MONTHLY_RENEWAL: 'monthly_renewal',
  PURCHASE: 'purchase'
} as const;

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing monthly subscription renewal');
    
    const body = await request.json();
    console.log('📦 Renewal request body:', JSON.stringify(body, null, 2));

    const { 
      userId, 
      user_id, 
      subscriptionId, 
      subscription_id,
      planId,
      product_id,
      orderId,
      order_id,
      checkoutId,
      checkout_id,
      renewalDate
    } = body;

    // 统一变量名
    const finalUserId = userId || user_id;
    const finalSubscriptionId = subscriptionId || subscription_id;
    const finalPlanId = planId || product_id;
    const finalOrderId = orderId || order_id;
    const finalCheckoutId = checkoutId || checkout_id;

    // 验证必要字段
    if (!finalUserId || !finalSubscriptionId) {
      console.error('❌ Missing required fields:', { finalUserId, finalSubscriptionId });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields (userId, subscriptionId)' 
      }, { status: 400 });
    }

    // 检查订阅是否存在且为月度订阅
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('creem_subscription_id', finalSubscriptionId)
      .eq('plan_name', 'monthly')
      .eq('status', 'active')
      .single();

    if (subscriptionError || !subscription) {
      console.error('❌ Monthly subscription not found:', subscriptionError);
      return NextResponse.json({ 
        success: false, 
        error: 'Monthly subscription not found or not active' 
      }, { status: 404 });
    }

    // 检查是否已经为本月续费
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

    const { data: existingRenewal, error: checkError } = await supabase
      .from('credits')
      .select('id')
      .eq('user_uuid', finalUserId)
      .eq('trans_type', TRANS_TYPE.MONTHLY_RENEWAL)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing renewal:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error checking renewal status' 
      }, { status: 500 });
    }

    if (existingRenewal && existingRenewal.length > 0) {
      console.log('✅ Monthly subscription already renewed this month');
      return NextResponse.json({ 
        success: true,
        message: 'Monthly subscription already renewed this month',
        alreadyRenewed: true
      }, { status: 200 });
    }

    // 处理月度订阅续费
    const result = await handleMonthlyRenewal(
      finalUserId,
      subscription,
      finalOrderId,
      finalCheckoutId,
      now
    );

    console.log('✅ Monthly subscription renewal processed successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Monthly subscription renewed successfully',
      result
    });

  } catch (error) {
    console.error('❌ Monthly subscription renewal failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Monthly subscription renewal failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleMonthlyRenewal(
  userId: string,
  subscription: any,
  orderId: string | null,
  checkoutId: string | null,
  now: Date
) {
  console.log(`🔄 Processing monthly renewal for subscription ${subscription.id}`);

  const startDate = new Date(subscription.start_date);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  try {
    // 更新订阅的结束日期（延长一个月）
    const newEndDate = new Date(subscription.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        end_date: newEndDate.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ Error updating subscription end date:', updateError);
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    console.log(`✅ Extended subscription ${subscription.id} to ${newEndDate.toISOString()}`);

    // 添加月度续费积分
    const transactionNo = generateTransactionNo();
    
    // 月度订阅续费积分：下个月同一日期清零
    const nextMonthExpiry = new Date(now);
    nextMonthExpiry.setMonth(nextMonthExpiry.getMonth() + 1);
    nextMonthExpiry.setDate(startDate.getDate()); // 设置为订阅开始日期
    nextMonthExpiry.setHours(0, 0, 0, 0);
    
    const { error: creditsError } = await supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: TRANS_TYPE.MONTHLY_RENEWAL,
        trans_no: transactionNo,
        order_no: orderId || `monthly_renewal_${currentYear}_${currentMonth.toString().padStart(2, '0')}`,
        credits: 500, // 月度订阅续费积分
        expired_at: nextMonthExpiry.toISOString(),
        created_at: now.toISOString()
      });

    if (creditsError) {
      console.error('❌ Error adding renewal credits:', creditsError);
      throw new Error(`Failed to add renewal credits: ${creditsError.message}`);
    }

    console.log(`✅ Added 500 renewal credits, transaction: ${transactionNo}`);

    // 创建续费订单记录
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: orderId || `renewal_${subscription.id}_${Date.now()}`,
        product_id: subscription.plan_id,
        product_name: 'Monthly subscription renewal',
        plan_type: 'monthly',
        amount: null,
        status: 'completed',
        checkout_id: checkoutId,
        subscription_id: subscription.creem_subscription_id,
        credits_granted: 500,
        payment_date: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select();

    if (orderError) {
      console.error('❌ Error creating renewal order record:', orderError);
      // 不让订单记录失败影响主流程
    } else {
      console.log('✅ Renewal order record created:', orderData);
    }

    return {
      success: true,
      renewalProcessed: true,
      creditsAdded: 500,
      transactionNo: transactionNo,
      newEndDate: newEndDate.toISOString(),
      data: {
        subscriptionId: subscription.id,
        creditsAdded: 500,
        expiryDate: nextMonthExpiry.toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Error in handleMonthlyRenewal:', error);
    throw error;
  }
}

// GET 请求：检查月度订阅续费状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const subscriptionId = searchParams.get('subscription_id');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing user_id parameter' 
      }, { status: 400 });
    }

    // 获取用户的月度订阅
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_name', 'monthly')
      .eq('status', 'active');

    if (subscriptionError) {
      console.error('❌ Error fetching monthly subscriptions:', subscriptionError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch subscriptions' 
      }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        hasActiveSubscription: false,
        subscriptions: []
      });
    }

    // 检查每个订阅的续费状态
    const subscriptionStatuses = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    for (const subscription of subscriptions) {
      const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const { data: renewalRecord, error: renewalError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', userId)
        .eq('trans_type', TRANS_TYPE.MONTHLY_RENEWAL)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)
        .limit(1);

      subscriptionStatuses.push({
        subscriptionId: subscription.id,
        creemSubscriptionId: subscription.creem_subscription_id,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        renewedThisMonth: renewalRecord && renewalRecord.length > 0,
        renewalRecord: renewalRecord?.[0] || null,
        needsRenewal: new Date(subscription.end_date) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7天内到期
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveSubscription: true,
      subscriptions: subscriptionStatuses,
      currentMonth: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
    });

  } catch (error) {
    console.error('❌ Error checking monthly subscription status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check subscription status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 