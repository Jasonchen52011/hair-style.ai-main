import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createOrUpdateUserCreditsBalance } from "@/models/userCreditsBalance";

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
    const result = await createOrUpdateUserCreditsBalance(user.id, credits);
    
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