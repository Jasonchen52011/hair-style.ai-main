import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('Auth test - User:', user?.id);
    console.log('Auth test - Error:', userError);
    console.log('Auth test - Headers:', Object.fromEntries(request.headers.entries()));

    return NextResponse.json({
      success: true,
      authenticated: !!user && !userError,
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.user_metadata?.name,
        avatar: user?.user_metadata?.avatar_url
      },
      error: userError?.message || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 