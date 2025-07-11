import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log('Getting credits for user:', userId);

    // 获取用户的活跃订阅
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString());

    if (subscriptionError) {
      console.error("Error fetching subscriptions:", subscriptionError);
      return NextResponse.json(
        { message: "Failed to fetch subscription data" },
        { status: 500 }
      );
    }

    // 从credits表中计算用户总积分
    const { data: creditRecords, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_uuid', userId)
      .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

    if (creditsError) {
      console.error("Error fetching credits:", creditsError);
      return NextResponse.json(
        { message: "Failed to fetch credits data" },
        { status: 500 }
      );
    }

    // 计算总积分（正数表示获得，负数表示消费）
    const totalCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

    // 获取用户profile信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, image')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      profile: profile || { id: userId, email: null, name: null, image: null },
      credits: Math.max(0, totalCredits),
      subscriptions: subscriptions || [],
      hasActiveSubscription: subscriptions && subscriptions.length > 0
    });

  } catch (error) {
    console.error("Error fetching user credits by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch user credits" },
      { status: 500 }
    );
  }
} 