import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // 获取 Supabase 客户端
    const supabase = await createClient();
    
    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 查找对应的订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .eq('user_uuid', user.id)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 检查订单状态
    if (order.status === 'paid') {
      return NextResponse.json({
        message: "Order already processed",
        order
      });
    }

    // 更新订单状态
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('order_no', order.order_no);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    // 添加积分
    const { createOrUpdateUserCreditsBalanceSupabase } = await import('@/models/userCreditsBalanceSupabase');
    await createOrUpdateUserCreditsBalanceSupabase(user.id, order.credits);

    // 创建积分交易记录
    const transactionNo = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await supabase
      .from('credits')
      .insert([{
        trans_no: transactionNo,
        created_at: new Date().toISOString(),
        user_uuid: user.id,
        type: 1, // 充值
        credits: order.credits,
        description: `Purchase ${order.credits} credits`,
        current_credits: order.credits,
        order_no: order.order_no
      }]);

    return NextResponse.json({
      success: true,
      message: "Order processed successfully",
      credits: order.credits
    });

  } catch (error: any) {
    console.error("Process order error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}