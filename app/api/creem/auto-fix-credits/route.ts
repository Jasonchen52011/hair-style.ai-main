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
  FIX: 'fix'
} as const;

function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `FIX_${timestamp}_${random}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const { order_id, user_id } = await request.json();

    if (!order_id || !user_id) {
      return NextResponse.json({
        fixed: false,
        error: 'Missing order_id or user_id'
      }, { status: 400 });
    }

    console.log(`🔧 Auto-fixing credits for order ${order_id}, user ${user_id}`);

    // 1. 查找订单记录
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', order_id)
      .eq('user_id', user_id)
      .single();

    if (orderError) {
      console.error('❌ Order not found:', orderError);
      return NextResponse.json({
        fixed: false,
        error: 'Order not found',
        details: orderError.message
      }, { status: 404 });
    }

    // 2. 检查是否已有credit记录
    const { data: existingCredits, error: creditCheckError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', user_id)
      .eq('order_no', order_id);

    if (creditCheckError) {
      console.error('❌ Error checking existing credits:', creditCheckError);
      return NextResponse.json({
        fixed: false,
        error: 'Failed to check existing credits',
        details: creditCheckError.message
      }, { status: 500 });
    }

    const expectedCredits = orderData.credits_granted || PRODUCT_CREDITS_MAP[orderData.product_id] || 0;
    const actualCredits = existingCredits?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

    if (actualCredits >= expectedCredits) {
      console.log(`✅ Credits already correct: Expected ${expectedCredits}, Actual ${actualCredits}`);
      return NextResponse.json({
        fixed: true,
        creditsAdded: 0,
        message: 'Credits already correctly allocated',
        expectedCredits,
        actualCredits
      });
    }

    // 3. 需要修复 - 添加缺失的积分
    const creditsToAdd = expectedCredits - actualCredits;
    const transactionNo = generateTransactionNo();

    // 根据产品类型设置过期时间
    const planType = PRODUCT_PLAN_MAP[orderData.product_id] || 'onetime';
    let expiredAt = null;

    if (planType === 'monthly') {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(0, 0, 0, 0);
      expiredAt = nextMonth.toISOString();
    } else if (planType === 'onetime') {
      // 一次性购买：检查用户订阅类型
      const { data: userSubscriptions } = await supabase
        .from('subscriptions')
        .select('end_date, plan_name')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .in('plan_name', ['monthly', 'yearly'])
        .order('end_date', { ascending: false })
        .limit(1);

      if (userSubscriptions && userSubscriptions.length > 0) {
        const userSubscription = userSubscriptions[0];
        if (userSubscription.plan_name === 'monthly') {
          expiredAt = userSubscription.end_date;
        } else if (userSubscription.plan_name === 'yearly') {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setHours(0, 0, 0, 0);
          expiredAt = nextMonth.toISOString();
        }
      }
    }
    // 年度订阅不设置过期时间

    // 4. 添加缺失的积分
    const { error: insertError } = await supabase
      .from('credits')
      .insert({
        user_uuid: user_id,
        trans_type: TRANS_TYPE.FIX,
        trans_no: transactionNo,
        order_no: order_id,
        credits: creditsToAdd,
        expired_at: expiredAt,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Error adding credits:', insertError);
      return NextResponse.json({
        fixed: false,
        error: 'Failed to add credits',
        details: insertError.message
      }, { status: 500 });
    }

    console.log(`✅ Credits fixed: Added ${creditsToAdd} credits for user ${user_id}, transaction: ${transactionNo}`);

    return NextResponse.json({
      fixed: true,
      creditsAdded: creditsToAdd,
      transactionNo,
      message: `Successfully added ${creditsToAdd} credits`,
      expectedCredits,
      actualCredits: actualCredits + creditsToAdd
    });

  } catch (error) {
    console.error('❌ Error in auto-fix-credits:', error);
    return NextResponse.json({
      fixed: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}