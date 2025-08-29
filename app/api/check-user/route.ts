import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function GET() {
  try {
    // 使用 Supabase Auth 检查用户
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({
        isLoggedIn: false,
        user: null,
        error: error?.message
      });
    }

    // 返回用户信息
    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        provider: "google"
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      isLoggedIn: false
    }, { status: 500 });
  }
}