import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProductCreditsMap } from '../../../../config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_CREDITS_MAP = getProductCreditsMap();

export async function POST(request: NextRequest) {
  try {
    const { order_id, user_id } = await request.json();

    if (!order_id || !user_id) {
      return NextResponse.json({
        verified: false,
        error: 'Missing order_id or user_id'
      }, { status: 400 });
    }

    console.log(`🔍 Verifying credits for order ${order_id}, user ${user_id}`);

    // 1. 查找对应的订单记录
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', order_id)
      .eq('user_id', user_id)
      .single();

    if (orderError) {
      console.error('❌ Error fetching order:', orderError);
      return NextResponse.json({
        verified: false,
        error: 'Order not found',
        details: orderError.message
      }, { status: 404 });
    }

    const expectedCredits = orderData.credits_granted || PRODUCT_CREDITS_MAP[orderData.product_id] || 0;

    // 2. 查找对应的credit记录
    const { data: creditRecords, error: creditError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', user_id)
      .eq('order_no', order_id);

    if (creditError) {
      console.error('❌ Error fetching credit records:', creditError);
      return NextResponse.json({
        verified: false,
        error: 'Failed to fetch credit records',
        details: creditError.message
      }, { status: 500 });
    }

    const actualCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

    // 3. 验证积分是否正确
    const verified = actualCredits === expectedCredits;

    console.log(`📊 Credit verification: Expected ${expectedCredits}, Actual ${actualCredits}, Verified: ${verified}`);

    return NextResponse.json({
      verified,
      expectedCredits,
      actualCredits,
      creditRecords,
      orderData,
      message: verified ? 'Credits verified successfully' : 'Credits mismatch detected'
    });

  } catch (error) {
    console.error('❌ Error in verify-credits:', error);
    return NextResponse.json({
      verified: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}