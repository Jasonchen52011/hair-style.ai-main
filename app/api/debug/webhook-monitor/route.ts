import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const user_id = searchParams.get('user_id');

    const timeThreshold = new Date();
    timeThreshold.setHours(timeThreshold.getHours() - hours);

    console.log(`🔍 Webhook monitoring report for last ${hours} hours`);

    // 1. 检查最近的订单
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .gte('created_at', timeThreshold.toISOString())
      .order('created_at', { ascending: false });

    if (user_id) {
      ordersQuery = ordersQuery.eq('user_id', user_id);
    }

    const { data: recentOrders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    // 2. 检查每个订单的积分分配情况
    const orderAnalysis = [];
    for (const order of recentOrders || []) {
      // 查找对应的credit记录
      const { data: creditRecords, error: creditError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', order.user_id)
        .eq('order_no', order.order_id);

      if (creditError) {
        console.error(`Error fetching credits for order ${order.order_id}:`, creditError);
        continue;
      }

      const totalCreditsAllocated = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;
      const expectedCredits = order.credits_granted || 0;

      orderAnalysis.push({
        order_id: order.order_id,
        user_id: order.user_id,
        product_id: order.product_id,
        expected_credits: expectedCredits,
        allocated_credits: totalCreditsAllocated,
        credit_records_count: creditRecords?.length || 0,
        status: order.status,
        created_at: order.created_at,
        is_missing_credits: totalCreditsAllocated < expectedCredits,
        credit_difference: expectedCredits - totalCreditsAllocated
      });
    }

    // 3. 统计分析
    const stats = {
      total_orders: recentOrders?.length || 0,
      orders_with_missing_credits: orderAnalysis.filter(o => o.is_missing_credits).length,
      total_credits_missing: orderAnalysis.reduce((sum, o) => sum + (o.credit_difference > 0 ? o.credit_difference : 0), 0)
    };

    // 4. 生成问题报告
    const issues = [];

    // 检查积分缺失问题
    const ordersWithMissingCredits = orderAnalysis.filter(o => o.is_missing_credits);
    if (ordersWithMissingCredits.length > 0) {
      issues.push({
        type: 'missing_credits',
        severity: 'high',
        count: ordersWithMissingCredits.length,
        message: `${ordersWithMissingCredits.length} orders have missing credits`,
        affected_orders: ordersWithMissingCredits.map(o => ({
          order_id: o.order_id,
          user_id: o.user_id,
          missing_credits: o.credit_difference
        }))
      });
    }

    // 检查最近是否有webhook失败
    const ordersWithoutCredits = orderAnalysis.filter(o => o.credit_records_count === 0);
    if (ordersWithoutCredits.length > 0) {
      issues.push({
        type: 'webhook_failure',
        severity: 'critical',
        count: ordersWithoutCredits.length,
        message: `${ordersWithoutCredits.length} orders have no credit records, indicating possible webhook failure`,
        affected_orders: ordersWithoutCredits.map(o => o.order_id)
      });
    }

    const report = {
      generated_at: new Date().toISOString(),
      time_range: `${hours} hours`,
      user_filter: user_id || 'all users',
      statistics: stats,
      issues: issues,
      order_analysis: orderAnalysis.slice(0, 20)
    };

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('❌ Webhook monitoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate monitoring report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}