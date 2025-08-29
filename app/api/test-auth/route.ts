import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from '@/utils/supabase/route-handler';
import { cookies } from "next/headers";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createRouteClient();
    
    // 获取用户信息
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // 获取所有cookie用于调试
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('supabase') || 
      c.name.includes('sb-')
    );
    
    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      authError: error?.message || null,
      cookieInfo: {
        totalCookies: allCookies.length,
        authCookies: authCookies.map(c => ({ 
          name: c.name, 
          hasValue: !!c.value,
          valuePreview: c.value ? c.value.substring(0, 20) + '...' : null
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}