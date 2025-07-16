import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // 如果用户未登录，不显示反馈弹窗
    if (!user || userError) {
      return NextResponse.json({
        shouldShow: false,
        reason: 'User not logged in'
      });
    }

    // 获取用户profile和订阅信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_feedback_shown')
      .eq('id', user.id)
      .single();

    // 检查用户是否有活跃订阅
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString());

    // 如果用户有活跃订阅（是会员），不显示反馈弹窗
    if (subscriptions && subscriptions.length > 0) {
      return NextResponse.json({
        shouldShow: false,
        reason: 'User has active subscription'
      });
    }

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
    
    if (!user || userError) {
      return NextResponse.json(
        { error: 'User not logged in' },
        { status: 401 }
      );
    }

    // 更新用户的最后反馈显示时间
    const { error } = await supabase
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