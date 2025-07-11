import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";

// 使用service role key创建管理员客户端
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 创建统一的时间格式函数
function getSupabaseTimeString(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' });
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      steps: {},
      recommendations: []
    };

    // 步骤1: 检查用户认证状态
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    diagnosis.steps.authentication = {
      success: !!user && !userError,
      error: userError?.message || null,
      user: user ? {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        created_at: user.created_at
      } : null
    };

    if (!user) {
      diagnosis.recommendations.push("用户未登录 - 请先访问 /signin 页面进行登录");
      return NextResponse.json(diagnosis);
    }

    // 步骤2: 检查auth.users表中的用户记录
    try {
      const { data: authUser, error: authError } = await adminSupabase
        .from('auth.users')
        .select('id, email, created_at, last_sign_in_at')
        .eq('id', user.id)
        .single();

      diagnosis.steps.authUser = {
        success: !authError,
        error: authError?.message || null,
        data: authUser
      };
    } catch (err) {
      diagnosis.steps.authUser = {
        success: false,
        error: 'Cannot access auth.users table directly',
        note: 'This is normal - auth.users table is protected'
      };
    }

    // 步骤3: 检查profiles表中的用户记录
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    diagnosis.steps.profileExists = {
      success: !profileError,
      error: profileError?.message || null,
      data: profile
    };

    if (profileError && profileError.code === 'PGRST116') {
      // 用户profile不存在 - 尝试创建
      diagnosis.recommendations.push("用户profile不存在，需要创建");
      
      // 步骤4: 尝试创建profile
      try {
        const currentTime = getSupabaseTimeString();
        const profileData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          has_access: false,
          created_at: currentTime,
          updated_at: currentTime,
        };

        const { data: newProfile, error: createError } = await adminSupabase
          .from('profiles')
          .insert(profileData)
          .select();

        diagnosis.steps.profileCreation = {
          success: !createError,
          error: createError?.message || null,
          data: newProfile,
          profileData: profileData
        };

        if (createError) {
          // 尝试upsert作为备用方案
          const { data: upsertProfile, error: upsertError } = await adminSupabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
            .select();

          diagnosis.steps.profileUpsert = {
            success: !upsertError,
            error: upsertError?.message || null,
            data: upsertProfile
          };

          if (!upsertError) {
            diagnosis.recommendations.push("✅ Profile创建成功（通过upsert）");
          } else {
            diagnosis.recommendations.push("❌ Profile创建失败 - 需要手动修复");
          }
        } else {
          diagnosis.recommendations.push("✅ Profile创建成功");
        }
      } catch (err) {
        diagnosis.steps.profileCreation = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
        diagnosis.recommendations.push("❌ Profile创建时发生异常");
      }
    } else if (profile) {
      diagnosis.recommendations.push("✅ 用户profile已存在，系统正常");
    } else {
      diagnosis.recommendations.push("❌ 无法查询profile表 - 可能是权限或表结构问题");
    }

    // 步骤5: 检查积分和订阅数据
    const { data: credits, error: creditsError } = await adminSupabase
      .from('credits')
      .select('*')
      .eq('user_uuid', user.id);

    diagnosis.steps.credits = {
      success: !creditsError,
      error: creditsError?.message || null,
      count: credits?.length || 0,
      totalCredits: credits?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0
    };

    const { data: subscriptions, error: subsError } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    diagnosis.steps.subscriptions = {
      success: !subsError,
      error: subsError?.message || null,
      count: subscriptions?.length || 0,
      data: subscriptions
    };

    // 生成最终建议
    if (diagnosis.steps.profileExists.success) {
      diagnosis.status = "✅ 系统正常";
      diagnosis.summary = "用户已登录且profile存在，可以正常使用系统";
    } else if (diagnosis.steps.profileCreation?.success || diagnosis.steps.profileUpsert?.success) {
      diagnosis.status = "🔧 已修复";
      diagnosis.summary = "用户profile已成功创建，现在可以正常使用系统";
    } else {
      diagnosis.status = "❌ 需要修复";
      diagnosis.summary = "用户profile创建失败，需要手动处理";
    }

    return NextResponse.json(diagnosis);

  } catch (error) {
    console.error("Profile diagnosis error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 