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

    // 获取用户profile信息（包括current_credits）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, image, current_credits')
      .eq('id', userId)
      .single();

    // 直接使用current_credits字段
    const currentCredits = profile?.current_credits || 0;

    return NextResponse.json({
      profile: profile || { id: userId, email: null, name: null, image: null },
      credits: Math.max(0, currentCredits),
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