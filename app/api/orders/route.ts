import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

// 使用service role key创建管理员客户端
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 获取当前登录用户
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        error: "请先登录查看订单",
        loginRequired: true
      }, { status: 401 });
    }

    console.log(`🔍 获取用户 ${user.id} 的订单列表`);

    // 从orders表中获取用户的所有订单
    const { data: orders, error: ordersError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError);
      return NextResponse.json({
        error: `获取订单失败: ${ordersError.message}`,
        suggestion: "可能需要创建 orders 表"
      }, { status: 500 });
    }

    // 获取用户的基本信息
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, email, name, image')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ 获取用户profile失败:', profileError);
    }

    console.log(`✅ 成功获取 ${orders?.length || 0} 个订单`);

    return NextResponse.json({
      success: true,
      orders: orders || [],
      profile: profile || null,
      total: orders?.length || 0
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "获取订单列表时发生未知错误"
    }, { status: 500 });
  }
} 