import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Add Bonus Credits ==");
    
    // 初始化 Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
    
    // 查询两个支付记录对应的用户UUID
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_uuid, user_email, order_no, paid_detail')
      .or('paid_detail.ilike.%pi_3S1fajBCTa3kEW1g07LQafFD%,paid_detail.ilike.%pi_3S1NwyBCTa3kEW1g0T9Mcuhv%');
    
    if (ordersError) {
      throw ordersError;
    }
    
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        error: "No orders found for the specified payment intents"
      }, { status: 404 });
    }
    
    console.log(`Found ${orders.length} orders to process`);
    
    const results = [];
    
    for (const order of orders) {
      console.log(`Processing user: ${order.user_uuid}`);
      
      // 更新用户积分余额
      const { createOrUpdateUserCreditsBalanceSupabase } = await import('@/models/userCreditsBalanceSupabase');
      const balanceResult = await createOrUpdateUserCreditsBalanceSupabase(order.user_uuid, 100);
      console.log(`Credits balance updated: ${balanceResult.balance}`);
      
      // 创建积分交易记录
      const transactionNo = `BONUS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: creditTransaction, error: creditsError } = await supabase
        .from('credits')
        .insert([{
          trans_no: transactionNo,
          created_at: new Date().toISOString(),
          user_uuid: order.user_uuid,
          trans_type: "bonus",
          credits: 100,
          order_no: `COMPENSATION_${order.order_no}`,
        }])
        .select()
        .single();
      
      if (creditsError) {
        throw creditsError;
      }
      
      console.log(`Bonus credits added: ${creditTransaction.id}`);
      
      results.push({
        user_uuid: order.user_uuid,
        user_email: order.user_email,
        bonus_credits: 100,
        new_balance: balanceResult.balance,
        transaction: creditTransaction
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Bonus credits added successfully",
      results: results
    });
    
  } catch (error) {
    console.error("Add bonus credits error:", error);
    return NextResponse.json({
      error: "Failed to add bonus credits",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}