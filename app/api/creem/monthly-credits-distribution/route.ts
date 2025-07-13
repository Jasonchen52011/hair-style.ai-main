import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 积分交易类型
const TRANS_TYPE = {
  MONTHLY_DISTRIBUTION: 'monthly_distribution',
  MONTHLY_RENEWAL: 'monthly_renewal'
} as const;

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（可以添加API密钥验证）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    console.log(`🔄 Starting monthly credits distribution for ${currentDate}`);

    // 1. 处理年度订阅的月度积分分发
    const yearlyResult = await processYearlySubscriptions(now, currentMonth, currentYear);
    
    // 2. 处理月度订阅的续费积分分配
    const monthlyResult = await processMonthlySubscriptions(now, currentMonth, currentYear);

    const totalDistributed = yearlyResult.distributed + monthlyResult.distributed;

    console.log(`✅ Monthly credits distribution completed. Total distributed: ${totalDistributed}`);

    return NextResponse.json({
      success: true,
      message: `Monthly credits distribution completed`,
      totalDistributed,
      yearly: yearlyResult,
      monthly: monthlyResult,
      distributedDate: currentDate
    });

  } catch (error) {
    console.error('❌ Monthly credits distribution failed:', error);
    return NextResponse.json({
      error: 'Monthly distribution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 处理年度订阅的月度积分分发
async function processYearlySubscriptions(now: Date, currentMonth: number, currentYear: number) {
  console.log(`📊 Processing yearly subscriptions for month ${currentMonth}/${currentYear}`);

  // 获取所有活跃的年度订阅
  const { data: yearlySubscriptions, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('plan_name', 'yearly')
    .eq('status', 'active')
    .gte('end_date', now.toISOString());

  if (fetchError) {
    console.error('❌ Error fetching yearly subscriptions:', fetchError);
    throw new Error(`Failed to fetch yearly subscriptions: ${fetchError.message}`);
  }

  if (!yearlySubscriptions || yearlySubscriptions.length === 0) {
    console.log('ℹ️  No active yearly subscriptions found');
    return { distributed: 0, results: [] };
  }

  console.log(`📊 Found ${yearlySubscriptions.length} active yearly subscriptions`);

  let distributedCount = 0;
  const results = [];

  for (const subscription of yearlySubscriptions) {
    try {
      const startDate = new Date(subscription.start_date);
      const subscriptionStartMonth = startDate.getMonth() + 1;
      const subscriptionStartYear = startDate.getFullYear();

      // 计算从订阅开始到现在的月数
      const monthsSinceStart = (currentYear - subscriptionStartYear) * 12 + (currentMonth - subscriptionStartMonth);

      // 检查是否应该在本月分发积分
      const shouldDistributeThisMonth = 
        monthsSinceStart >= 0 && 
        monthsSinceStart < 12 && // 年度订阅最多12个月
        now.getDate() >= startDate.getDate(); // 当前日期大于等于订阅开始日期

      if (!shouldDistributeThisMonth) {
        continue;
      }

      // 检查本月是否已经分发过积分
      const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const { data: existingDistribution, error: checkError } = await supabase
        .from('credits')
        .select('id')
        .eq('user_uuid', subscription.user_id)
        .eq('trans_type', TRANS_TYPE.MONTHLY_DISTRIBUTION)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)
        .limit(1);

      if (checkError) {
        console.error(`❌ Error checking existing distribution for subscription ${subscription.id}:`, checkError);
        continue;
      }

      if (existingDistribution && existingDistribution.length > 0) {
        console.log(`⏭️  Already distributed credits for subscription ${subscription.id} this month`);
        continue;
      }

      // 分发1000积分
      const transactionNo = generateTransactionNo();
      
      // 年度订阅的月度积分：下个月同一日期清零
      const nextMonthExpiry = new Date(now);
      nextMonthExpiry.setMonth(nextMonthExpiry.getMonth() + 1);
      nextMonthExpiry.setHours(0, 0, 0, 0);
      
      // 获取当前积分
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_credits')
        .eq('id', subscription.user_id)
        .single();

      if (profileError) {
        console.error(`❌ Failed to fetch profile for subscription ${subscription.id}:`, profileError);
        results.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          success: false,
          error: `Failed to fetch user profile: ${profileError.message}`
        });
        continue;
      }

      const currentCredits = profile?.current_credits || 0;

      // 同时更新credits表和profiles表
      const [creditResult, profileResult] = await Promise.all([
        supabase
          .from('credits')
          .insert({
            user_uuid: subscription.user_id,
            trans_type: TRANS_TYPE.MONTHLY_DISTRIBUTION,
            trans_no: transactionNo,
            order_no: `monthly_${currentYear}_${currentMonth.toString().padStart(2, '0')}`,
            credits: 1000, // 正数表示获得积分
            expired_at: nextMonthExpiry.toISOString(),
            created_at: now.toISOString(),
            event_type: 'monthly_distribution'
          }),
        supabase
          .from('profiles')
          .update({
            current_credits: currentCredits + 1000,
            updated_at: now.toISOString()
          })
          .eq('id', subscription.user_id)
      ]);

      if (creditResult.error) {
        console.error(`❌ Error distributing credits for subscription ${subscription.id}:`, creditResult.error);
        results.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          success: false,
          error: creditResult.error.message
        });
      } else if (profileResult.error) {
        console.error(`❌ Error updating profile credits for subscription ${subscription.id}:`, profileResult.error);
        results.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          success: false,
          error: profileResult.error.message
        });
      } else {
        console.log(`✅ Distributed 1000 credits to subscription ${subscription.id}, transaction: ${transactionNo}`);
        distributedCount++;
        results.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          success: true,
          creditsAdded: 1000,
          transactionNo: transactionNo
        });
      }

    } catch (error) {
      console.error(`❌ Error processing subscription ${subscription.id}:`, error);
      results.push({
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { distributed: distributedCount, results };
}

// 处理月度订阅的续费积分分配
async function processMonthlySubscriptions(now: Date, currentMonth: number, currentYear: number) {
  console.log(`📊 Processing monthly subscriptions for month ${currentMonth}/${currentYear}`);

  // 获取所有活跃的月度订阅
  const { data: monthlySubscriptions, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('plan_name', 'monthly')
    .eq('status', 'active')
    .gte('end_date', now.toISOString());

  if (fetchError) {
    console.error('❌ Error fetching monthly subscriptions:', fetchError);
    throw new Error(`Failed to fetch monthly subscriptions: ${fetchError.message}`);
  }

  if (!monthlySubscriptions || monthlySubscriptions.length === 0) {
    console.log('ℹ️  No active monthly subscriptions found');
    return { distributed: 0, results: [] };
  }

  console.log(`📊 Found ${monthlySubscriptions.length} active monthly subscriptions`);

  let distributedCount = 0;
  const results = [];

  for (const subscription of monthlySubscriptions) {
    try {
      const startDate = new Date(subscription.start_date);
      const subscriptionStartMonth = startDate.getMonth() + 1;
      const subscriptionStartYear = startDate.getFullYear();

      // 🔒 强化首次购买检查：不仅检查月份，还要检查是否是当月新创建的订阅
      const isFirstMonth = 
        subscriptionStartYear === currentYear && 
        subscriptionStartMonth === currentMonth;
      
      // 额外检查：如果订阅是在当月创建的，跳过处理
      const subscriptionCreateTime = new Date(subscription.created_at);
      const isRecentlyCreated = (now.getTime() - subscriptionCreateTime.getTime()) < 24 * 60 * 60 * 1000; // 24小时内创建的
      
      if (isFirstMonth || isRecentlyCreated) {
        console.log(`⏭️  Skipping first month for subscription ${subscription.id} (already handled in purchase) - isFirstMonth: ${isFirstMonth}, isRecentlyCreated: ${isRecentlyCreated}`);
        continue;
      }

      // 🔒 额外的幂等性检查：确保用户没有相同积分数量的purchase记录
      const { data: recentPurchases, error: purchaseCheckError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', subscription.user_id)
        .eq('trans_type', 'purchase')
        .eq('credits', 500) // 月度订阅积分
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()) // 24小时内
        .limit(1);

      if (purchaseCheckError) {
        console.error(`❌ Error checking recent purchases for subscription ${subscription.id}:`, purchaseCheckError);
        continue;
      }

      if (recentPurchases && recentPurchases.length > 0) {
        console.log(`⏭️  Skipping renewal for subscription ${subscription.id} - found recent purchase record`);
        continue;
      }

      // 检查是否应该在本月分发积分（每月订阅日期到期后续费）
      const shouldDistributeThisMonth = 
        now.getDate() >= startDate.getDate() && // 当前日期大于等于订阅开始日期
        now >= startDate; // 当前时间晚于订阅开始时间

      if (!shouldDistributeThisMonth) {
        continue;
      }

      // 检查本月是否已经分发过积分
      const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const { data: existingDistribution, error: checkError } = await supabase
        .from('credits')
        .select('id')
        .eq('user_uuid', subscription.user_id)
        .eq('trans_type', TRANS_TYPE.MONTHLY_RENEWAL)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)
        .limit(1);

      if (checkError) {
        console.error(`❌ Error checking existing renewal for subscription ${subscription.id}:`, checkError);
        continue;
      }

      if (existingDistribution && existingDistribution.length > 0) {
        console.log(`⏭️  Already distributed renewal credits for subscription ${subscription.id} this month`);
        continue;
      }

      // 分发500积分（月度订阅续费）
      const transactionNo = generateTransactionNo();
      
      // 月度订阅的续费积分：下个月同一日期清零
      const nextMonthExpiry = new Date(now);
      nextMonthExpiry.setMonth(nextMonthExpiry.getMonth() + 1);
      nextMonthExpiry.setDate(startDate.getDate()); // 设置为订阅开始日期
      nextMonthExpiry.setHours(0, 0, 0, 0);
      
      const { error: creditsError } = await supabase
        .from('credits')
        .insert({
          user_uuid: subscription.user_id,
          trans_type: TRANS_TYPE.MONTHLY_RENEWAL,
          trans_no: transactionNo,
          order_no: `monthly_renewal_${currentYear}_${currentMonth.toString().padStart(2, '0')}`,
          credits: 500, // 月度订阅续费积分
          expired_at: nextMonthExpiry.toISOString(),
          created_at: now.toISOString(),
          event_type: 'monthly_renewal'
        });

      if (creditsError) {
        console.error(`❌ Error distributing renewal credits for subscription ${subscription.id}:`, creditsError);
        results.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          success: false,
          error: creditsError.message
        });
      } else {
        console.log(`✅ Distributed 500 renewal credits to subscription ${subscription.id}, transaction: ${transactionNo}`);
        distributedCount++;
        results.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          success: true,
          creditsAdded: 500,
          transactionNo: transactionNo
        });
      }

    } catch (error) {
      console.error(`❌ Error processing monthly subscription ${subscription.id}:`, error);
      results.push({
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return { distributed: distributedCount, results };
}

// GET方法用于测试
export async function GET() {
  return NextResponse.json({
    message: 'Monthly credits distribution endpoint',
    usage: 'POST with Authorization header'
  });
} 