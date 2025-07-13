import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const event_type = searchParams.get('event_type');

    const results: any = {
      timestamp: new Date().toISOString(),
      query_params: { user_id, limit, event_type },
      data: {}
    };

    // 1. 如果指定了用户ID，查询该用户的credits记录
    if (user_id) {
      let query = supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (event_type) {
        query = query.eq('event_type', event_type);
      }

      const { data: userCredits, error: userError } = await query;
      
      results.data.user_credits = {
        success: !userError,
        error: userError?.message || null,
        count: userCredits?.length || 0,
        records: userCredits || []
      };

      // 查询用户总积分
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_credits')
        .eq('id', user_id)
        .single();

      results.data.user_profile = {
        success: !profileError,
        error: profileError?.message || null,
        current_credits: profile?.current_credits || 0
      };
    }

    // 2. 查询最近的credits记录（不限用户）
    const { data: recentCredits, error: recentError } = await supabase
      .from('credits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    results.data.recent_credits = {
      success: !recentError,
      error: recentError?.message || null,
      count: recentCredits?.length || 0,
      records: recentCredits || []
    };

    // 3. EventType统计
    const { data: eventTypeStats, error: statsError } = await supabase
      .from('credits')
      .select('event_type, trans_type, credits')
      .not('event_type', 'is', null);

    if (!statsError && eventTypeStats) {
      const stats = eventTypeStats.reduce((acc: any, record: any) => {
        const key = `${record.event_type}|${record.trans_type}`;
        if (!acc[key]) {
          acc[key] = {
            event_type: record.event_type,
            trans_type: record.trans_type,
            count: 0,
            total_credits: 0
          };
        }
        acc[key].count += 1;
        acc[key].total_credits += record.credits || 0;
        return acc;
      }, {});

      results.data.event_type_stats = {
        success: true,
        stats: Object.values(stats)
      };
    } else {
      results.data.event_type_stats = {
        success: false,
        error: statsError?.message || null
      };
    }

    // 4. 检查最近1小时的记录
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentHourCredits, error: hourError } = await supabase
      .from('credits')
      .select('event_type')
      .gte('created_at', oneHourAgo);

    if (!hourError && recentHourCredits) {
      const hourStats = {
        total_records: recentHourCredits.length,
        with_event_type: recentHourCredits.filter(r => r.event_type !== null).length,
        without_event_type: recentHourCredits.filter(r => r.event_type === null).length
      };

      results.data.recent_hour_stats = {
        success: true,
        since: oneHourAgo,
        stats: hourStats
      };
    } else {
      results.data.recent_hour_stats = {
        success: false,
        error: hourError?.message || null
      };
    }

    // 5. 简单检查是否有event_type字段（通过查询一条记录）
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('credits')
      .select('event_type')
      .limit(1)
      .single();

    results.data.table_schema = {
      success: !sampleError || sampleError.code === 'PGRST116', // PGRST116 = no rows found
      error: sampleError?.message || null,
      has_event_type_field: !sampleError ? true : (sampleError.code === 'PGRST116' ? 'no_data' : 'unknown')
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error("Error in check-credits:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 简化的POST方法用于触发特定测试
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, user_id } = body;

    if (action === 'create_test_credit') {
      const timestamp = Date.now();
      const testRecord = {
        user_uuid: user_id || `test-user-${timestamp}`,
        trans_type: 'purchase',
        trans_no: `TEST_${timestamp}`,
        order_no: `test-order-${timestamp}`,
        credits: 100,
        expired_at: null,
        created_at: new Date().toISOString(),
        event_type: 'test_event'
      };

      const { data, error } = await supabase
        .from('credits')
        .insert(testRecord)
        .select()
        .single();

      return NextResponse.json({
        success: !error,
        error: error?.message || null,
        test_record: data,
        message: error ? 'Failed to create test record' : 'Test record created successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 