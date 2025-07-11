import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    const supabaseClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        error: "请先登录查看积分状态",
        loginRequired: true
      }, { status: 401 });
    }

    console.log(`🔍 检查用户 ${user.id} 的积分状态`);

    // 1. 检查 credits 表中的积分记录
    const { data: creditRecords, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', user.id)
      .order('created_at', { ascending: false });

    if (creditsError) {
      return NextResponse.json({
        error: `无法读取积分表: ${creditsError.message}`,
        suggestion: "可能需要创建 credits 表"
      }, { status: 500 });
    }

    // 计算总积分
    const totalCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

    // 2. 检查订阅状态
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString());

    const hasActiveSubscription = subscriptions && subscriptions.length > 0;

    // 3. 分析积分记录
    const purchaseRecords = creditRecords?.filter(r => r.trans_type === 'purchase') || [];
    const consumptionRecords = creditRecords?.filter(r => r.trans_type === 'hairstyle') || [];
    const bonusRecords = creditRecords?.filter(r => r.trans_type === 'bonus') || [];

    const purchaseCredits = purchaseRecords.reduce((sum, r) => sum + (r.credits || 0), 0);
    const consumptionCredits = consumptionRecords.reduce((sum, r) => sum + (r.credits || 0), 0);
    const bonusCredits = bonusRecords.reduce((sum, r) => sum + (r.credits || 0), 0);

    return NextResponse.json({
      success: true,
      user_id: user.id,
      current_credits: totalCredits,
      has_active_subscription: hasActiveSubscription,
      records_summary: {
        total_records: creditRecords?.length || 0,
        purchases: {
          count: purchaseRecords.length,
          total_credits: purchaseCredits
        },
        consumptions: {
          count: consumptionRecords.length,
          total_credits: consumptionCredits
        },
        bonus: {
          count: bonusRecords.length,
          total_credits: bonusCredits
        }
      },
      all_records: creditRecords,
      active_subscriptions: subscriptions,
      analysis: {
        credits_cleared: totalCredits === 0 && (purchaseCredits > 0 || bonusCredits > 0),
        negative_balance: totalCredits < 0,
        needs_investigation: totalCredits === 0 && creditRecords && creditRecords.length > 0
      }
    });

  } catch (error) {
    console.error('积分检查错误:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "检查积分时发生未知错误"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, amount } = await request.json();

    // 获取当前用户
    const supabaseClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        error: "请先登录"
      }, { status: 401 });
    }

    if (action === 'add_credits' && amount && amount > 0) {
      // 添加积分（用于修复或测试）
      const transactionNo = `FIX_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
      
      const { error: insertError } = await supabase
        .from('credits')
        .insert({
          user_uuid: user.id,
          trans_type: 'bonus',
          trans_no: transactionNo,
          order_no: `fix_credits_${Date.now()}`,
          credits: amount,
          expired_at: null,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: `添加积分失败: ${insertError.message}`
        }, { status: 500 });
      }

      // 获取更新后的积分
      const { data: updatedRecords } = await supabase
        .from('credits')
        .select('credits')
        .eq('user_uuid', user.id)
        .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

      const newTotal = updatedRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

      return NextResponse.json({
        success: true,
        message: `成功添加${amount}积分`,
        transaction_no: transactionNo,
        new_total: newTotal
      });
    }

    if (action === 'test_consumption') {
      // 测试积分扣除（扣除1积分）
      const transactionNo = `TEST_CONSUME_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
      
      // 先检查当前积分
      const { data: currentRecords } = await supabase
        .from('credits')
        .select('credits')
        .eq('user_uuid', user.id)
        .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

      const currentCredits = currentRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;
      
      if (currentCredits < 1) {
        return NextResponse.json({
          success: false,
          error: `积分不足，当前积分: ${currentCredits}`
        }, { status: 400 });
      }

      const { error: insertError } = await supabase
        .from('credits')
        .insert({
          user_uuid: user.id,
          trans_type: 'hairstyle',
          trans_no: transactionNo,
          order_no: `test_consume_${Date.now()}`,
          credits: -1, // 负数表示消费
          expired_at: null,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: `测试扣费失败: ${insertError.message}`
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "成功扣除1积分（测试）",
        transaction_no: transactionNo,
        remaining_credits: currentCredits - 1
      });
    }

    return NextResponse.json({
      error: "无效的操作"
    }, { status: 400 });

  } catch (error) {
    console.error('积分操作错误:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 });
  }
} 