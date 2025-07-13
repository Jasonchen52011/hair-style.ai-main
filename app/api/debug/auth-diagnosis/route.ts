import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

// 使用service role key创建管理员客户端
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      checks: {},
      recommendations: [],
      summary: {
        authStatus: 'unknown',
        profileStatus: 'unknown',
        overall: 'unknown'
      }
    };

    // 检查 1: 环境变量
    diagnosis.checks.environmentVariables = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      status: 'pass'
    };

    if (!diagnosis.checks.environmentVariables.supabaseUrl || 
        !diagnosis.checks.environmentVariables.supabaseAnonKey || 
        !diagnosis.checks.environmentVariables.supabaseServiceKey) {
      diagnosis.checks.environmentVariables.status = 'fail';
      diagnosis.recommendations.push('❌ 缺少必要的环境变量配置');
    }

    // 检查 2: 创建客户端连接
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // 检查当前用户认证状态
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      diagnosis.checks.authentication = {
        success: !!user && !userError,
        error: userError?.message || null,
        user: user ? {
          id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          metadata: user.user_metadata
        } : null
      };

      if (!user) {
        diagnosis.summary.authStatus = 'not_authenticated';
        diagnosis.recommendations.push('🔒 用户未登录 - 请访问 /signin 页面进行登录');
        diagnosis.summary.overall = 'needs_authentication';
      } else {
        diagnosis.summary.authStatus = 'authenticated';
        
        // 检查 3: 用户档案是否存在
        const { data: profile, error: profileError } = await adminSupabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        diagnosis.checks.profile = {
          exists: !!profile && !profileError,
          error: profileError?.message || null,
          data: profile
        };

        if (!profile) {
          diagnosis.summary.profileStatus = 'missing';
          diagnosis.recommendations.push('❌ 用户档案不存在 - 请尝试重新登录');
          diagnosis.summary.overall = 'needs_profile_creation';
        } else {
          diagnosis.summary.profileStatus = 'exists';
          diagnosis.summary.overall = 'healthy';
        }

        // 检查 4: 数据库连接测试
        try {
          const { data: testQuery, error: testError } = await adminSupabase
            .from('profiles')
            .select('id')
            .limit(1);

          diagnosis.checks.databaseConnection = {
            success: !testError,
            error: testError?.message || null
          };

          if (testError) {
            diagnosis.recommendations.push('❌ 数据库连接失败 - 请检查Supabase配置');
          }
        } catch (dbError: any) {
          diagnosis.checks.databaseConnection = {
            success: false,
            error: dbError.message
          };
          diagnosis.recommendations.push('❌ 数据库连接异常 - 请检查网络和配置');
        }

        // 检查 5: Cookie状态 - 修复await问题
        const cookieStore = await cookies();
        const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
        const cookiePrefix = `sb-${supabaseUrl.hostname.split('.')[0]}`;
        const authCookie = cookieStore.get(`${cookiePrefix}-auth-token`);

        diagnosis.checks.cookies = {
          authCookieExists: !!authCookie,
          cookieName: `${cookiePrefix}-auth-token`,
          cookieValue: authCookie ? 'exists' : 'missing'
        };

        if (!authCookie) {
          diagnosis.recommendations.push('⚠️ 身份验证Cookie缺失 - 可能需要重新登录');
        }
      }
    } catch (authError: any) {
      diagnosis.checks.authentication = {
        success: false,
        error: authError.message
      };
      diagnosis.recommendations.push('❌ 身份验证检查失败 - 请检查Supabase配置');
      diagnosis.summary.overall = 'error';
    }

    // 生成总结建议
    if (diagnosis.summary.overall === 'healthy') {
      diagnosis.recommendations.unshift('✅ 身份验证系统运行正常');
    } else if (diagnosis.summary.overall === 'needs_authentication') {
      diagnosis.recommendations.unshift('🔑 请先登录以继续诊断');
    } else if (diagnosis.summary.overall === 'needs_profile_creation') {
      diagnosis.recommendations.unshift('👤 需要创建用户档案 - 建议重新登录');
    }

    return NextResponse.json(diagnosis, { status: 200 });
  } catch (error: any) {
    console.error('诊断过程中发生错误:', error);
    return NextResponse.json({
      error: '诊断失败',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 