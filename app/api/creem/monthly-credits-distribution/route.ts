import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 积分交易类型
const TRANS_TYPE = {
  MONTHLY_DISTRIBUTION: 'monthly_distribution'
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

    // 获取所有活跃的年度订阅
    const { data: yearlySubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('plan_name', 'yearly')
      .eq('status', 'active')
      .gte('end_date', now.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching yearly subscriptions:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!yearlySubscriptions || yearlySubscriptions.length === 0) {
      console.log('ℹ️  No active yearly subscriptions found');
      return NextResponse.json({ 
        message: 'No active yearly subscriptions found',
        distributed: 0
      });
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
        // 查询当前月是否已经有月度分发记录
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
        
        const { error: creditsError } = await supabase
          .from('credits')
          .insert({
            user_uuid: subscription.user_id,
            trans_type: TRANS_TYPE.MONTHLY_DISTRIBUTION,
            trans_no: transactionNo,
            order_no: `monthly_${currentYear}_${currentMonth.toString().padStart(2, '0')}`,
            credits: 1000, // 正数表示获得积分
            expired_at: nextMonthExpiry.toISOString(),
            created_at: now.toISOString()
          });

        if (creditsError) {
          console.error(`❌ Error distributing credits for subscription ${subscription.id}:`, creditsError);
          results.push({
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            success: false,
            error: creditsError.message
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

    console.log(`✅ Monthly credits distribution completed. Distributed to ${distributedCount} subscriptions`);

    return NextResponse.json({
      success: true,
      message: `Monthly credits distribution completed`,
      date: currentDate,
      totalSubscriptions: yearlySubscriptions.length,
      distributed: distributedCount,
      results
    });

  } catch (error) {
    console.error('❌ Error in monthly credits distribution:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET方法用于测试
export async function GET() {
  return NextResponse.json({
    message: 'Monthly credits distribution endpoint',
    usage: 'POST with Authorization header'
  });
} 