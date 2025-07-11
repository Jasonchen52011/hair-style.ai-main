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

    console.log(`🔍 Diagnosing credits for user: ${userId}`);

    const results: any = {
      timestamp: new Date().toISOString(),
      userId,
      diagnosis: {},
      recommendations: []
    };

    // 1. 获取用户profile信息
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      results.diagnosis.profile = {
        success: !profileError,
        error: profileError?.message || null,
        data: profile
      };
    } catch (err) {
      results.diagnosis.profile = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 2. 获取所有积分记录
    try {
      const { data: creditRecords, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', userId)
        .order('created_at', { ascending: false });

      const validCredits = creditRecords?.filter(record => 
        !record.expired_at || new Date(record.expired_at) > new Date()
      ) || [];

      const totalCredits = validCredits.reduce((sum, record) => sum + (record.credits || 0), 0);
      const allTimeCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

      results.diagnosis.credits = {
        success: !creditsError,
        error: creditsError?.message || null,
        totalRecords: creditRecords?.length || 0,
        validRecords: validCredits.length,
        currentCredits: totalCredits,
        allTimeCredits: allTimeCredits,
        records: creditRecords || [],
        validRecords: validCredits
      };
    } catch (err) {
      results.diagnosis.credits = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 3. 获取所有订阅记录
    try {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const activeSubscriptions = subscriptions?.filter(sub => 
        sub.status === 'active' && new Date(sub.end_date) > new Date()
      ) || [];

      results.diagnosis.subscriptions = {
        success: !subscriptionsError,
        error: subscriptionsError?.message || null,
        totalSubscriptions: subscriptions?.length || 0,
        activeSubscriptions: activeSubscriptions.length,
        subscriptions: subscriptions || [],
        activeOnes: activeSubscriptions
      };
    } catch (err) {
      results.diagnosis.subscriptions = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // 4. 分析年费订阅情况
    const yearlySubscriptions = results.diagnosis.subscriptions.subscriptions?.filter(
      (sub: any) => sub.plan_name === 'yearly'
    ) || [];

    const activeYearlySubscriptions = results.diagnosis.subscriptions.activeOnes?.filter(
      (sub: any) => sub.plan_name === 'yearly'
    ) || [];

    results.diagnosis.yearlyAnalysis = {
      totalYearlySubscriptions: yearlySubscriptions.length,
      activeYearlySubscriptions: activeYearlySubscriptions.length,
      latestYearlySub: yearlySubscriptions[0] || null,
      yearlySubscriptions: yearlySubscriptions
    };

    // 5. 分析年费相关的积分记录
    const yearlyCredits = results.diagnosis.credits.records?.filter((record: any) => 
      record.trans_type === 'purchase' && record.credits === 1000
    ) || [];

    const monthlyDistributions = results.diagnosis.credits.records?.filter((record: any) => 
      record.trans_type === 'monthly_distribution'
    ) || [];

    results.diagnosis.yearlyCreditsAnalysis = {
      yearlyPurchaseCredits: yearlyCredits.length,
      monthlyDistributions: monthlyDistributions.length,
      yearlyCreditsData: yearlyCredits,
      monthlyDistributionsData: monthlyDistributions
    };

    // 6. 生成诊断建议
    if (activeYearlySubscriptions.length > 0 && yearlyCredits.length === 0) {
      results.recommendations.push({
        type: 'missing_initial_credits',
        message: '年费订阅存在但缺少初始1000积分记录',
        action: 'need_manual_credit_addition',
        severity: 'high'
      });
    }

    if (activeYearlySubscriptions.length > 0) {
      const latestYearly = activeYearlySubscriptions[0];
      const subscriptionDate = new Date(latestYearly.created_at);
      const now = new Date();
      const monthsSinceSubscription = (now.getFullYear() - subscriptionDate.getFullYear()) * 12 + 
                                     (now.getMonth() - subscriptionDate.getMonth());
      
      if (monthlyDistributions.length < monthsSinceSubscription) {
        results.recommendations.push({
          type: 'missing_monthly_distributions',
          message: `年费订阅已${monthsSinceSubscription}个月，但只有${monthlyDistributions.length}次月度分发`,
          action: 'check_monthly_distribution_cron',
          severity: 'medium'
        });
      }
    }

    if (results.diagnosis.credits.currentCredits < 3310 && activeYearlySubscriptions.length > 0) {
      results.recommendations.push({
        type: 'credit_shortage',
        message: `当前积分${results.diagnosis.credits.currentCredits}，预期3310，差额${3310 - results.diagnosis.credits.currentCredits}`,
        action: 'manual_credit_fix_needed',
        severity: 'high'
      });
    }

    // 7. 生成修复方案
    results.fixOptions = {
      addMissingCredits: {
        description: '手动添加缺失的年费初始积分',
        creditsToAdd: 1000,
        endpoint: '/api/creem/fix-credits',
        parameters: {
          userId: userId,
          amount: 1000,
          transType: 'purchase',
          reason: 'yearly_subscription_initial_credits_fix'
        }
      },
      triggerMonthlyDistribution: {
        description: '触发月度积分分发（如果需要）',
        endpoint: '/api/creem/monthly-credits-distribution',
        note: '需要CRON_SECRET授权'
      }
    };

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('User credits diagnosis error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
} 