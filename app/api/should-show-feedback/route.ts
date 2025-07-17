import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { checkActiveSubscription, getSimpleDbClient } from '@/lib/simple-auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // 如果用户未登录，返回false（前端会使用localStorage处理24小时限制）
    if (!user || userError) {
      return NextResponse.json({
        shouldShow: false,
        reason: 'User not logged in - frontend should handle with localStorage'
      });
    }

    // 使用统一的订阅检查函数
    const hasActiveSubscription = await checkActiveSubscription(user.id);
    
    // 如果用户有活跃订阅（是会员），不显示反馈弹窗
    if (hasActiveSubscription) {
      return NextResponse.json({
        shouldShow: false,
        reason: 'User has active subscription'
      });
    }

    // 获取用户profile信息（使用管理员客户端以保持一致性）
    const adminSupabase = getSimpleDbClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('last_feedback_shown')
      .eq('id', user.id)
      .single();

    // 检查24小时限制
    if (profile?.last_feedback_shown) {
      const lastShown = new Date(profile.last_feedback_shown);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return NextResponse.json({
          shouldShow: false,
          reason: `Last shown ${Math.round(hoursDiff)} hours ago, need to wait ${Math.round(24 - hoursDiff)} more hours`
        });
      }
    }

    // 满足所有条件，可以显示反馈弹窗
    return NextResponse.json({
      shouldShow: true,
      reason: 'Non-member logged in user, 24h cooldown passed'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 记录反馈弹窗已显示（不需要用户提交反馈，只要显示了就记录）
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // 对于未登录用户，我们无法在数据库中记录，但返回成功避免前端报错
    if (!user || userError) {
      return NextResponse.json({
        message: 'Feedback shown for anonymous user (not recorded in database)'
      });
    }

    // 使用管理员客户端更新用户的最后反馈显示时间
    const adminSupabase = getSimpleDbClient();
    const { error } = await adminSupabase
      .from('profiles')
      .update({ 
        last_feedback_shown: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update last_feedback_shown:', error);
      return NextResponse.json(
        { error: 'Failed to update feedback timestamp' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feedback shown timestamp updated'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}