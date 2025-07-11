import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // 1. 检查profiles表结构和数据
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(3);
      
      results.tests.profiles = {
        success: !profilesError,
        error: profilesError?.message || null,
        count: profiles?.length || 0,
        data: profiles || [],
        hasCreditsField: profiles && profiles.length > 0 ? ('credits' in profiles[0]) : false
      };
    } catch (err) {
      results.tests.profiles = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 2. 检查credits表数据
    try {
      const { data: creditRecords, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .limit(5);
      
      results.tests.credits_table = {
        success: !creditsError,
        error: creditsError?.message || null,
        count: creditRecords?.length || 0,
        data: creditRecords || []
      };
    } catch (err) {
      results.tests.credits_table = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 3. 检查subscriptions表数据
    try {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .limit(3);
      
      results.tests.subscriptions = {
        success: !subscriptionsError,
        error: subscriptionsError?.message || null,
        count: subscriptions?.length || 0,
        data: subscriptions || []
      };
    } catch (err) {
      results.tests.subscriptions = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 4. 尝试查询具体用户的数据（从测试中看到的用户ID）
    const testUserId = "46ddf6ac-0d70-4502-b362-66aef071499b";
    try {
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      const { data: userCredits, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', testUserId);

      const { data: userSubs, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', testUserId);

      results.tests.specific_user = {
        userId: testUserId,
        profile: {
          success: !userError,
          error: userError?.message || null,
          data: userProfile
        },
        credits: {
          success: !creditsError,
          error: creditsError?.message || null,
          data: userCredits,
          total: userCredits?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0
        },
        subscriptions: {
          success: !subsError,
          error: subsError?.message || null,
          data: userSubs
        }
      };
    } catch (err) {
      results.tests.specific_user = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Debug check credits error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
} 