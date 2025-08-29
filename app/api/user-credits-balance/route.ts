import { NextResponse } from "next/server";
import { getUserUuid } from "@/services/userSupabase";
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const runtime = "edge";

export async function GET() {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseClient();
    
    // 获取用户积分余额
    const { data: balance } = await supabaseAdmin
      .from('user_credits_balance')
      .select('*')
      .eq('user_uuid', userUuid)
      .single();
    
    return NextResponse.json({
      balance: balance?.balance || 0,
      user_uuid: userUuid,
    });
  } catch (error) {
    console.error("Error fetching user credits balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits balance" },
      { status: 500 }
    );
  }
}