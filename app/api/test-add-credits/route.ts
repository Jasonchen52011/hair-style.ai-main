import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
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
    const { credits = 100 } = await request.json();
    
    // 获取当前用户
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // 添加积分
    const supabaseAdmin = getSupabaseClient();
    
    // 查询现有余额
    const { data: existingBalance } = await supabaseAdmin
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', user.id)
      .single();
    
    let result;
    if (existingBalance) {
      // 更新余额
      const { data, error } = await supabaseAdmin
        .from('user_credits_balance')
        .update({
          balance: existingBalance.balance + credits,
          updated_at: new Date().toISOString(),
        })
        .eq('user_uuid', user.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // 创建新记录
      const { data, error } = await supabaseAdmin
        .from('user_credits_balance')
        .insert({
          user_uuid: user.id,
          balance: credits,
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      newBalance: result.balance,
      message: `Added ${credits} credits successfully`
    });
  } catch (error: any) {
    console.error("Error adding credits:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add credits" },
      { status: 500 }
    );
  }
}