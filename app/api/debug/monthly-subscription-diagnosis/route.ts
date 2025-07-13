import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProductCreditsMap, getProductPlanMap } from '../../../../config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_CREDITS_MAP = getProductCreditsMap();
const PRODUCT_PLAN_MAP = getProductPlanMap();

// GET 请求：诊断月度订阅状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const days = parseInt(searchParams.get('days') || '30');
    const includeCredits = searchParams.get('include_credits') === 'true';

    console.log(`🔍 Starting monthly subscription diagnosis...`);
    
    // 获取时间范围
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 1. 获取月度订阅概况
    const monthlyOverview = await getMonthlySubscriptionOverview(userId, startDate);
    
    // 2. 获取积分分配状况
    const creditsAnalysis = includeCredits ? await getMonthlyCreditsAnalysis(userId, startDate) : null;
    
    // 3. 获取常见问题诊断
    const issues = await diagnoseCommonIssues(userId, startDate);
    
    // 4. 获取处理建议
    const recommendations = await generateRecommendations(issues);

    return NextResponse.json({
      success: true,
      diagnosis: {
        timestamp: now.toISOString(),
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        monthlySubscriptions: monthlyOverview,
        creditsAnalysis,
        issues,
        recommendations
      }
    });

  } catch (error) {
    console.error('❌ Monthly subscription diagnosis failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Monthly subscription diagnosis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 获取月度订阅概况
async function getMonthlySubscriptionOverview(userId: string | null, startDate: Date) {
  console.log('📊 Analyzing monthly subscriptions...');

  let query = supabase
    .from('subscriptions')
    .select('*')
    .eq('plan_name', 'monthly');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: allSubscriptions, error } = await query;

  if (error) {
    console.error('❌ Error fetching monthly subscriptions:', error);
    throw error;
  }

  const now = new Date();
  const active = allSubscriptions?.filter(sub => 
    sub.status === 'active' && new Date(sub.end_date) > now
  ) || [];
  
  const expired = allSubscriptions?.filter(sub => 
    sub.status === 'active' && new Date(sub.end_date) <= now
  ) || [];
  
  const cancelled = allSubscriptions?.filter(sub => 
    sub.status === 'cancelled'
  ) || [];

  const recent = allSubscriptions?.filter(sub => 
    new Date(sub.created_at) >= startDate
  ) || [];

  return {
    total: allSubscriptions?.length || 0,
    active: active.length,
    expired: expired.length,
    cancelled: cancelled.length,
    recent: recent.length,
    activeSubscriptions: active.map(sub => ({
      id: sub.id,
      userId: sub.user_id,
      startDate: sub.start_date,
      endDate: sub.end_date,
      creemSubscriptionId: sub.creem_subscription_id,
      daysRemaining: Math.ceil((new Date(sub.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    })),
    expiredSubscriptions: expired.map(sub => ({
      id: sub.id,
      userId: sub.user_id,
      endDate: sub.end_date,
      daysExpired: Math.ceil((now.getTime() - new Date(sub.end_date).getTime()) / (1000 * 60 * 60 * 24))
    }))
  };
}

// 获取月度积分分析
async function getMonthlyCreditsAnalysis(userId: string | null, startDate: Date) {
  console.log('💰 Analyzing monthly credits...');

  let query = supabase
    .from('credits')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .or('trans_type.eq.purchase,trans_type.eq.monthly_renewal');

  if (userId) {
    query = query.eq('user_uuid', userId);
  }

  const { data: credits, error } = await query;

  if (error) {
    console.error('❌ Error fetching monthly credits:', error);
    throw error;
  }

  const purchaseCredits = credits?.filter(c => c.trans_type === 'purchase') || [];
  const renewalCredits = credits?.filter(c => c.trans_type === 'monthly_renewal') || [];

  const totalPurchaseCredits = purchaseCredits.reduce((sum, c) => sum + (c.credits || 0), 0);
  const totalRenewalCredits = renewalCredits.reduce((sum, c) => sum + (c.credits || 0), 0);

  return {
    totalCreditsAllocated: totalPurchaseCredits + totalRenewalCredits,
    purchaseCredits: {
      count: purchaseCredits.length,
      total: totalPurchaseCredits,
      records: purchaseCredits.map(c => ({
        transactionNo: c.trans_no,
        credits: c.credits,
        createdAt: c.created_at,
        expiredAt: c.expired_at
      }))
    },
    renewalCredits: {
      count: renewalCredits.length,
      total: totalRenewalCredits,
      records: renewalCredits.map(c => ({
        transactionNo: c.trans_no,
        credits: c.credits,
        createdAt: c.created_at,
        expiredAt: c.expired_at
      }))
    }
  };
}

// 诊断常见问题
async function diagnoseCommonIssues(userId: string | null, startDate: Date) {
  console.log('🔍 Diagnosing common issues...');

  const issues = [];

  // 1. 检查活跃订阅但没有积分的情况
  const activeSubscriptionsWithoutCredits = await findActiveSubscriptionsWithoutCredits(userId);
  if (activeSubscriptionsWithoutCredits.length > 0) {
    issues.push({
      type: 'missing_credits',
      severity: 'high',
      description: 'Active monthly subscriptions without corresponding credits',
      count: activeSubscriptionsWithoutCredits.length,
      details: activeSubscriptionsWithoutCredits
    });
  }

  // 2. 检查过期订阅
  const expiredSubscriptions = await findExpiredSubscriptions(userId);
  if (expiredSubscriptions.length > 0) {
    issues.push({
      type: 'expired_subscriptions',
      severity: 'medium',
      description: 'Subscriptions that have expired and may need renewal',
      count: expiredSubscriptions.length,
      details: expiredSubscriptions
    });
  }

  // 3. 检查积分分配不一致
  const inconsistentCredits = await findInconsistentCredits(userId, startDate);
  if (inconsistentCredits.length > 0) {
    issues.push({
      type: 'inconsistent_credits',
      severity: 'medium',
      description: 'Credit allocations that don\'t match expected amounts',
      count: inconsistentCredits.length,
      details: inconsistentCredits
    });
  }

  // 4. 检查缺失的续费记录
  const missingRenewals = await findMissingRenewals(userId);
  if (missingRenewals.length > 0) {
    issues.push({
      type: 'missing_renewals',
      severity: 'high',
      description: 'Monthly subscriptions that should have renewed but didn\'t',
      count: missingRenewals.length,
      details: missingRenewals
    });
  }

  return issues;
}

// 查找活跃订阅但没有积分的情况
async function findActiveSubscriptionsWithoutCredits(userId: string | null) {
  let subscriptionQuery = supabase
    .from('subscriptions')
    .select('*')
    .eq('plan_name', 'monthly')
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString());

  if (userId) {
    subscriptionQuery = subscriptionQuery.eq('user_id', userId);
  }

  const { data: subscriptions, error } = await subscriptionQuery;
  if (error) throw error;

  const issues = [];
  
  for (const sub of subscriptions || []) {
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', sub.user_id)
      .or('trans_type.eq.purchase,trans_type.eq.monthly_renewal')
      .gte('created_at', sub.start_date);

    if (creditsError) continue;

    if (!credits || credits.length === 0) {
      issues.push({
        subscriptionId: sub.id,
        userId: sub.user_id,
        startDate: sub.start_date,
        endDate: sub.end_date,
        creemSubscriptionId: sub.creem_subscription_id
      });
    }
  }

  return issues;
}

// 查找过期订阅
async function findExpiredSubscriptions(userId: string | null) {
  let query = supabase
    .from('subscriptions')
    .select('*')
    .eq('plan_name', 'monthly')
    .eq('status', 'active')
    .lt('end_date', new Date().toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: subscriptions, error } = await query;
  if (error) throw error;

  return subscriptions?.map(sub => ({
    subscriptionId: sub.id,
    userId: sub.user_id,
    endDate: sub.end_date,
    daysExpired: Math.ceil((new Date().getTime() - new Date(sub.end_date).getTime()) / (1000 * 60 * 60 * 24))
  })) || [];
}

// 查找积分分配不一致
async function findInconsistentCredits(userId: string | null, startDate: Date) {
  let query = supabase
    .from('credits')
    .select('*')
    .eq('trans_type', 'purchase')
    .gte('created_at', startDate.toISOString());

  if (userId) {
    query = query.eq('user_uuid', userId);
  }

  const { data: credits, error } = await query;
  if (error) throw error;

  const issues = [];
  
  for (const credit of credits || []) {
    if (credit.credits !== 500) { // 月度订阅应该是500积分
      issues.push({
        transactionNo: credit.trans_no,
        userId: credit.user_uuid,
        expectedCredits: 500,
        actualCredits: credit.credits,
        createdAt: credit.created_at
      });
    }
  }

  return issues;
}

// 查找缺失的续费记录
async function findMissingRenewals(userId: string | null) {
  // 获取所有创建时间超过1个月的活跃月度订阅
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  let query = supabase
    .from('subscriptions')
    .select('*')
    .eq('plan_name', 'monthly')
    .eq('status', 'active')
    .lt('start_date', oneMonthAgo.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: subscriptions, error } = await query;
  if (error) throw error;

  const issues = [];
  
  for (const sub of subscriptions || []) {
    const { data: renewals, error: renewalError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', sub.user_id)
      .eq('trans_type', 'monthly_renewal')
      .gte('created_at', sub.start_date);

    if (renewalError) continue;

    const startDate = new Date(sub.start_date);
    const now = new Date();
    const monthsSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (monthsSinceStart > 1 && (!renewals || renewals.length < monthsSinceStart - 1)) {
      issues.push({
        subscriptionId: sub.id,
        userId: sub.user_id,
        startDate: sub.start_date,
        expectedRenewals: monthsSinceStart - 1,
        actualRenewals: renewals?.length || 0,
        missingRenewals: (monthsSinceStart - 1) - (renewals?.length || 0)
      });
    }
  }

  return issues;
}

// 生成处理建议
async function generateRecommendations(issues: any[]) {
  const recommendations = [];

  for (const issue of issues) {
    switch (issue.type) {
      case 'missing_credits':
        recommendations.push({
          priority: 'high',
          action: 'Add missing credits',
          description: `Run the payment-success-callback API for ${issue.count} subscriptions to add missing credits`,
          apiEndpoint: 'POST /api/creem/payment-success-callback',
          details: issue.details
        });
        break;
      
      case 'expired_subscriptions':
        recommendations.push({
          priority: 'medium',
          action: 'Process expired subscriptions',
          description: `Update ${issue.count} expired subscriptions or notify users for renewal`,
          apiEndpoint: 'POST /api/creem/monthly-subscription-renewal',
          details: issue.details
        });
        break;
      
      case 'inconsistent_credits':
        recommendations.push({
          priority: 'medium',
          action: 'Fix credit amounts',
          description: `Correct ${issue.count} credit allocations that don't match expected amounts`,
          details: issue.details
        });
        break;
      
      case 'missing_renewals':
        recommendations.push({
          priority: 'high',
          action: 'Process missing renewals',
          description: `Add ${issue.count} missing renewal credit allocations`,
          apiEndpoint: 'POST /api/creem/monthly-credits-distribution',
          details: issue.details
        });
        break;
    }
  }

  return recommendations;
}

// POST 请求：自动修复常见问题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, subscriptionId, force = false } = body;

    console.log(`🔧 Executing auto-fix action: ${action}`);

    let result;
    
    switch (action) {
      case 'fix_missing_credits':
        result = await fixMissingCredits(userId, subscriptionId, force);
        break;
      
      case 'process_expired_subscriptions':
        result = await processExpiredSubscriptions(userId, force);
        break;
      
      case 'fix_missing_renewals':
        result = await fixMissingRenewals(userId, subscriptionId, force);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error('❌ Auto-fix failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Auto-fix failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 修复缺失的积分
async function fixMissingCredits(userId: string | null, subscriptionId: string | null, force: boolean) {
  console.log('🔧 Fixing missing credits...');
  
  const issues = await findActiveSubscriptionsWithoutCredits(userId);
  const results = [];

  for (const issue of issues) {
    if (subscriptionId && issue.subscriptionId !== subscriptionId) continue;

    try {
      // 为订阅添加初始积分
      const transactionNo = `FIX_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(0, 0, 0, 0);

      const { error: creditError } = await supabase
        .from('credits')
        .insert({
          user_uuid: issue.userId,
          trans_type: 'purchase',
          trans_no: transactionNo,
          order_no: `fix_${issue.subscriptionId}`,
          credits: 500,
          expired_at: nextMonth.toISOString(),
          created_at: new Date().toISOString(),
          event_type: 'manual_fix'
        });

      if (creditError) {
        results.push({
          subscriptionId: issue.subscriptionId,
          success: false,
          error: creditError.message
        });
      } else {
        results.push({
          subscriptionId: issue.subscriptionId,
          success: true,
          creditsAdded: 500,
          transactionNo
        });
      }

    } catch (error) {
      results.push({
        subscriptionId: issue.subscriptionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { fixed: results.filter(r => r.success).length, results };
}

// 处理过期订阅
async function processExpiredSubscriptions(userId: string | null, force: boolean) {
  console.log('🔧 Processing expired subscriptions...');
  
  const expiredSubs = await findExpiredSubscriptions(userId);
  const results = [];

  for (const expiredSub of expiredSubs) {
    try {
      // 将过期订阅标记为过期状态
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', expiredSub.subscriptionId);

      if (updateError) {
        results.push({
          subscriptionId: expiredSub.subscriptionId,
          success: false,
          error: updateError.message
        });
      } else {
        results.push({
          subscriptionId: expiredSub.subscriptionId,
          success: true,
          action: 'marked_as_expired'
        });
      }

    } catch (error) {
      results.push({
        subscriptionId: expiredSub.subscriptionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { processed: results.filter(r => r.success).length, results };
}

// 修复缺失的续费记录
async function fixMissingRenewals(userId: string | null, subscriptionId: string | null, force: boolean) {
  console.log('🔧 Fixing missing renewals...');
  
  const missingRenewals = await findMissingRenewals(userId);
  const results = [];

  for (const missing of missingRenewals) {
    if (subscriptionId && missing.subscriptionId !== subscriptionId) continue;

    try {
      // 为每个缺失的续费月份添加积分
      for (let i = 0; i < missing.missingRenewals; i++) {
        const transactionNo = `RENEWAL_FIX_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
        const renewalMonth = new Date(missing.startDate);
        renewalMonth.setMonth(renewalMonth.getMonth() + i + 1);
        
        const expiry = new Date(renewalMonth);
        expiry.setMonth(expiry.getMonth() + 1);
        expiry.setHours(0, 0, 0, 0);

        const { error: creditError } = await supabase
          .from('credits')
          .insert({
            user_uuid: missing.userId,
            trans_type: 'monthly_renewal',
            trans_no: transactionNo,
            order_no: `renewal_fix_${missing.subscriptionId}_${i}`,
            credits: 500,
            expired_at: expiry.toISOString(),
            created_at: renewalMonth.toISOString()
          });

        if (creditError) {
          results.push({
            subscriptionId: missing.subscriptionId,
            renewalMonth: renewalMonth.toISOString(),
            success: false,
            error: creditError.message
          });
        } else {
          results.push({
            subscriptionId: missing.subscriptionId,
            renewalMonth: renewalMonth.toISOString(),
            success: true,
            creditsAdded: 500,
            transactionNo
          });
        }
      }

    } catch (error) {
      results.push({
        subscriptionId: missing.subscriptionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { fixed: results.filter(r => r.success).length, results };
} 