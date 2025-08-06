import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 初始化 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const orderNo = searchParams.get('order_no');
    const userEmail = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // 如果提供了订单号，精确查询
    if (orderNo) {
      query = query.eq('order_no', orderNo);
    }
    
    // 如果提供了邮箱，查询该用户的订单
    if (userEmail) {
      query = query.eq('user_email', userEmail);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ 
        error: "Failed to fetch orders",
        details: error 
      }, { status: 500 });
    }

    // 统计信息
    const stats = {
      total_orders: orders?.length || 0,
      paid_orders: orders?.filter(o => o.status === 'paid').length || 0,
      pending_orders: orders?.filter(o => o.status === 'pending').length || 0,
      created_orders: orders?.filter(o => o.status === 'created').length || 0,
    };

    // 如果查询特定订单，还要检查相关的积分记录
    let creditsInfo = null;
    if (orderNo && orders && orders.length > 0) {
      const order = orders[0];
      const { data: credits, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .eq('order_no', orderNo);
      
      creditsInfo = {
        credits_records: credits,
        credits_error: creditsError
      };
    }

    return NextResponse.json({
      success: true,
      stats,
      orders,
      creditsInfo,
      query_params: {
        order_no: orderNo,
        email: userEmail,
        limit
      }
    });

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Unexpected error occurred",
      message: error.message 
    }, { status: 500 });
  }
}

// 创建一个 POST 端点来手动修复订单
export async function POST(request: NextRequest) {
  try {
    const { order_no, action } = await request.json();
    
    if (!order_no || !action) {
      return NextResponse.json({ 
        error: "Missing required parameters: order_no and action" 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 根据 action 执行不同操作
    if (action === 'mark_paid') {
      // 将订单标记为已支付
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('order_no', order_no)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: "Order marked as paid",
        order: data 
      });
    }

    return NextResponse.json({ 
      error: "Unknown action" 
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}