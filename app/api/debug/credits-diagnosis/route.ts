import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // 在函数内部创建管理员客户端（绕过RLS）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }
  
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "userId parameter is required"
      }, { status: 400 });
    }

    console.log(`🔍 Diagnosing credits for user: ${userId}`);

    // 1. 检查用户profile中的积分
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, current_credits, updated_at')
      .eq('id', userId)
      .single();

    // 2. 获取credits表中的所有积分记录
    const { data: creditRecords, error: creditsError } = await adminSupabase
      .from('credits')
      .select('*')
      .eq('user_uuid', userId)
      .order('created_at', { ascending: false });

    // 3. 计算credits表中的实际积分总和
    const totalCreditsFromRecords = creditRecords?.reduce((sum, record) => 
      sum + (record.credits || 0), 0) || 0;

    // 4. 获取最近的订单
    const { data: orders, error: ordersError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. 获取订阅信息
    const { data: subscriptions, error: subscriptionsError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 6. 获取最近的积分交易
    const recentCredits = creditRecords?.slice(0, 10) || [];

    // 计算数据一致性
    const isConsistent = profile?.current_credits === totalCreditsFromRecords;

    const diagnosis = {
      userId: userId,
      timestamp: new Date().toISOString(),
      profile: {
        exists: !!profile,
        current_credits: profile?.current_credits || 0,
        updated_at: profile?.updated_at,
        error: profileError?.message
      },
      creditsRecords: {
        count: creditRecords?.length || 0,
        totalCredits: totalCreditsFromRecords,
        error: creditsError?.message,
        recent: recentCredits.map(record => ({
          trans_no: record.trans_no,
          trans_type: record.trans_type,
          credits: record.credits,
          order_no: record.order_no,
          created_at: record.created_at,
          event_type: record.event_type
        }))
      },
      orders: {
        count: orders?.length || 0,
        error: ordersError?.message,
        recent: orders?.map(order => ({
          order_id: order.order_id,
          product_id: order.product_id,
          status: order.status,
          credits_granted: order.credits_granted,
          created_at: order.created_at
        })) || []
      },
      subscriptions: {
        count: subscriptions?.length || 0,
        error: subscriptionsError?.message,
        recent: subscriptions?.map(sub => ({
          plan_name: sub.plan_name,
          status: sub.status,
          credits: sub.credits,
          creem_subscription_id: sub.creem_subscription_id,
          created_at: sub.created_at
        })) || []
      },
      consistency: {
        isConsistent,
        profileCredits: profile?.current_credits || 0,
        calculatedCredits: totalCreditsFromRecords,
        difference: (profile?.current_credits || 0) - totalCreditsFromRecords
      },
      recommendations: [] as Array<{issue: string; description: string; action: string}>
    };

    // 添加建议
    if (!isConsistent) {
      diagnosis.recommendations.push({
        issue: "数据不一致",
        description: `profile.current_credits (${profile?.current_credits}) 与 credits表计算总和 (${totalCreditsFromRecords}) 不匹配`,
        action: "需要修复profile表中的current_credits字段"
      });
    }

    if (creditRecords && creditRecords.length === 0) {
      diagnosis.recommendations.push({
        issue: "没有积分记录",
        description: "用户没有任何积分交易记录",
        action: "检查webhook是否正确处理了积分分配"
      });
    }

    if (!profile) {
      diagnosis.recommendations.push({
        issue: "用户profile不存在",
        description: "用户profile记录不存在",
        action: "确保用户已正确注册并创建了profile"
      });
    }

    return NextResponse.json({
      success: true,
      diagnosis
    });

  } catch (error) {
    console.error('Error in credits diagnosis:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST方法用于修复积分不一致问题
export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "userId is required"
      }, { status: 400 });
    }

    if (action === 'fix_credits') {
      // 重新计算并修复用户积分
      const { data: creditRecords, error: creditsError } = await adminSupabase
        .from('credits')
        .select('credits')
        .eq('user_uuid', userId);

      if (creditsError) {
        throw new Error(`Failed to fetch credit records: ${creditsError.message}`);
      }

      const correctTotalCredits = creditRecords?.reduce((sum, record) => 
        sum + (record.credits || 0), 0) || 0;

      // 更新profile表中的积分
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          current_credits: correctTotalCredits,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update profile credits: ${updateError.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `积分已修复：从credits表计算得出${correctTotalCredits}积分`,
        correctedCredits: correctTotalCredits
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action. Supported actions: 'fix_credits'"
    }, { status: 400 });

  } catch (error) {
    console.error('Error in credits repair:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 