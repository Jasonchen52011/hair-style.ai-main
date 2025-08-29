import { NextResponse } from "next/server";
import { getUserUuid } from "@/services/userSupabase";
import { getSnowId } from "@/lib/hash";
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { credits = 10 } = await request.json(); // 默认消耗10积分

    // 获取用户信息
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseClient();
    
    // 检查用户积分余额
    const { data: balance, error: balanceError } = await supabaseAdmin
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', userUuid)
      .single();
      
    if (balanceError || !balance || balance.balance < credits) {
      return NextResponse.json(
        { 
          error: "Insufficient credits", 
          currentBalance: balance?.balance || 0,
          requiredCredits: credits 
        },
        { status: 400 }
      );
    }

    // 扣除积分
    const { data: updatedBalance, error: updateError } = await supabaseAdmin
      .from('user_credits_balance')
      .update({
        balance: balance.balance - credits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_uuid', userUuid)
      .select()
      .single();
      
    if (updateError) {
      throw updateError;
    }

    // 创建积分使用记录
    const { error: creditError } = await supabaseAdmin
      .from('credits')
      .insert({
        trans_no: getSnowId(),
        created_at: new Date().toISOString(),
        user_uuid: userUuid,
        trans_type: "consume",
        credits: -credits, // 负数表示消耗
        order_no: null,
      });
      
    if (creditError) {
      throw creditError;
    }

    return NextResponse.json({
      success: true,
      remainingCredits: updatedBalance.balance,
      creditsUsed: credits,
    });
  } catch (error) {
    console.error("Error using credits:", error);
    return NextResponse.json(
      { error: "Failed to use credits" },
      { status: 500 }
    );
  }
}