import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    // 验证会话是否有效
    const supabase = createRouteHandlerClient({ cookies });
    
    // 这里可以添加数据库验证逻辑
    // 暂时使用简单验证
    
    return NextResponse.json({ 
      authenticated: true,
      sessionToken: sessionToken
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}