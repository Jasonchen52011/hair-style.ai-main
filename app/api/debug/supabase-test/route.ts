import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 创建统一的时间格式函数
function getSupabaseTimeString(): string {
  return new Date().toISOString();
}

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      environmentVariables: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      tests: {}
    };

    // 1. 测试基本连接
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      results.tests.basicConnection = {
        success: !error,
        error: error?.message || null,
        data: data
      };
    } catch (err) {
      results.tests.basicConnection = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 2. 测试 profiles 表
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      results.tests.profiles = {
        success: !error,
        error: error?.message || null,
        count: data?.length || 0,
        sampleData: data?.[0] || null
      };
    } catch (err) {
      results.tests.profiles = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 3. 测试 subscriptions 表
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);
      
      results.tests.subscriptions = {
        success: !error,
        error: error?.message || null,
        count: data?.length || 0,
        sampleData: data?.[0] || null
      };
    } catch (err) {
      results.tests.subscriptions = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 4. 测试插入权限 (使用正确的时间格式)
    try {
      const testUserId = crypto.randomUUID();
      const currentTime = getSupabaseTimeString();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          name: 'Test User',
          created_at: currentTime,
          updated_at: currentTime
        })
        .select();

      // 如果插入成功，立即删除测试数据
      if (!error && data) {
        await supabase
          .from('profiles')
          .delete()
          .eq('id', testUserId);
      }

      results.tests.insertPermission = {
        success: !error,
        error: error?.message || null,
        testData: data
      };
    } catch (err) {
      results.tests.insertPermission = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 5. 测试 upsert 权限
    try {
      const testUserId = crypto.randomUUID();
      const currentTime = getSupabaseTimeString();
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: testUserId,
          email: 'test-upsert@example.com',
          name: 'Test Upsert User',
          created_at: currentTime,
          updated_at: currentTime
        })
        .select();

      // 如果插入成功，立即删除测试数据
      if (!error && data) {
        await supabase
          .from('profiles')
          .delete()
          .eq('id', testUserId);
      }

      results.tests.upsertPermission = {
        success: !error,
        error: error?.message || null,
        testData: data
      };
    } catch (err) {
      results.tests.upsertPermission = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 6. 测试订阅表的插入权限
    try {
      const testUserId = crypto.randomUUID();
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const currentTime = getSupabaseTimeString();
      
      // 先创建用户profile（满足外键约束）
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test-sub@example.com',
          name: 'Test Subscription User',
          created_at: currentTime,
          updated_at: currentTime
        });

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // 然后创建订阅
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: testUserId,
          plan_id: 'test-plan',
          status: 'active',
          creem_subscription_id: 'test-sub-' + Date.now(),
          credits: '100',
          start_date: now.toISOString(),
          end_date: futureDate.toISOString()
        })
        .select();

      // 清理测试数据（先删除订阅，再删除profile）
      if (!error && data) {
        await supabase
          .from('subscriptions')
          .delete()
          .eq('user_id', testUserId);
      }
      
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);

      results.tests.subscriptionInsert = {
        success: !error,
        error: error?.message || null,
        testData: data
      };
    } catch (err) {
      results.tests.subscriptionInsert = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 计算总体成功率
    const totalTests = Object.keys(results.tests).length;
    const successfulTests = Object.values(results.tests).filter((test: any) => test.success).length;
    
    results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: `${Math.round((successfulTests / totalTests) * 100)}%`
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'check_rls_policies') {
      // 检查 RLS 策略
      const { data, error } = await supabase
        .rpc('check_rls_policies');

      return NextResponse.json({
        rlsPolicies: data,
        error: error?.message || null
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Supabase POST test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 