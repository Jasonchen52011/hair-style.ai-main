import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    // 获取 Supabase 客户端
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
    
    // 查询最近的订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ordersError) {
      throw ordersError;
    }
    
    // 查询最近的积分记录
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (creditsError) {
      throw creditsError;
    }
    
    // 查询用户积分余额
    const { data: balances, error: balancesError } = await supabase
      .from('user_credits_balance')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (balancesError) {
      throw balancesError;
    }
    
    return NextResponse.json({
      orders: orders,
      credits: credits,
      balances: balances,
      summary: {
        total_orders: orders.length,
        paid_orders: orders.filter(o => o.status === 'paid').length,
        pending_orders: orders.filter(o => o.status === 'created').length
      }
    });
    
  } catch (error) {
    console.error("Debug orders error:", error);
    return NextResponse.json({
      error: "Query failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}