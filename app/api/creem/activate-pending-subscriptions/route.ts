import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 积分交易类型
const TRANS_TYPE = {
  PURCHASE: 'purchase',
  MONTHLY_DISTRIBUTION: 'monthly_distribution',
  ACTIVATION: 'activation'
} as const;

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（与其他定时任务使用相同的验证）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`🔄 Starting pending subscription activation at ${now.toISOString()}`);

    // 查找所有应该激活的待激活订阅
    const { data: pendingSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'pending')
      .lte('start_date', now.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching pending subscriptions:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch pending subscriptions',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!pendingSubscriptions || pendingSubscriptions.length === 0) {
      console.log('ℹ️  No pending subscriptions to activate');
      return NextResponse.json({ 
        message: 'No pending subscriptions to activate',
        activated: 0
      });
    }

    console.log(`📊 Found ${pendingSubscriptions.length} pending subscriptions to activate`);

    let activatedCount = 0;
    const results = [];

    for (const subscription of pendingSubscriptions) {
      try {
        // 激活订阅
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`❌ Failed to activate subscription ${subscription.id}:`, updateError);
          results.push({
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            success: false,
            error: updateError.message
          });
          continue;
        }

        // 如果是月度订阅，添加初始积分
        if (subscription.plan_name === 'monthly') {
          const transactionNo = generateTransactionNo();
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setHours(0, 0, 0, 0);

          const { error: creditError } = await supabase
            .from('credits')
            .insert({
              user_uuid: subscription.user_id,
              trans_type: TRANS_TYPE.ACTIVATION,
              trans_no: transactionNo,
              order_no: `activation_${subscription.id}`,
              credits: 500, // 月度订阅初始积分
              expired_at: nextMonth.toISOString(),
              created_at: now.toISOString()
            });

          if (creditError) {
            console.error(`❌ Failed to add activation credits for subscription ${subscription.id}:`, creditError);
            results.push({
              subscriptionId: subscription.id,
              userId: subscription.user_id,
              success: false,
              error: `Subscription activated but failed to add credits: ${creditError.message}`
            });
            continue;
          }

          console.log(`✅ Activated subscription ${subscription.id} with 500 credits for user ${subscription.user_id}`);
          activatedCount++;
          results.push({
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            success: true,
            creditsAdded: 500,
            transactionNo: transactionNo
          });
        } else {
          console.log(`✅ Activated subscription ${subscription.id} for user ${subscription.user_id}`);
          activatedCount++;
          results.push({
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            success: true,
            creditsAdded: 0
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

    // 同时处理过期的订阅
    await handleExpiredSubscriptions(now);

    console.log(`✅ Pending subscription activation completed. Activated ${activatedCount} subscriptions`);

    return NextResponse.json({
      success: true,
      message: `Activation completed successfully`,
      timestamp: now.toISOString(),
      totalActivated: activatedCount,
      results: results
    });

  } catch (error) {
    console.error('❌ Error in activate-pending-subscriptions:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// 处理过期的订阅
async function handleExpiredSubscriptions(now: Date) {
  try {
    // 查找所有过期但状态为"expiring"的订阅
    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'expiring')
      .lt('end_date', now.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching expiring subscriptions:', fetchError);
      return;
    }

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return;
    }

    console.log(`📊 Found ${expiringSubscriptions.length} expiring subscriptions to process`);

    for (const subscription of expiringSubscriptions) {
      try {
        // 将状态更改为"expired"
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`❌ Failed to expire subscription ${subscription.id}:`, updateError);
        } else {
          console.log(`✅ Expired subscription ${subscription.id} for user ${subscription.user_id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing expiring subscription ${subscription.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in handleExpiredSubscriptions:', error);
  }
}

// GET 方法用于手动触发或状态检查
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // 检查待激活的订阅
    const { data: pendingSubscriptions, error: pendingError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_name, start_date, end_date, status')
      .eq('status', 'pending')
      .order('start_date', { ascending: true });

    if (pendingError) {
      return NextResponse.json({ 
        error: 'Failed to fetch pending subscriptions',
        details: pendingError.message 
      }, { status: 500 });
    }

    // 检查即将过期的订阅
    const { data: expiringSubscriptions, error: expiringError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_name, start_date, end_date, status')
      .eq('status', 'expiring')
      .order('end_date', { ascending: true });

    if (expiringError) {
      return NextResponse.json({ 
        error: 'Failed to fetch expiring subscriptions',
        details: expiringError.message 
      }, { status: 500 });
    }

    // 分析待激活的订阅
    const readyToActivate = pendingSubscriptions?.filter(sub => 
      new Date(sub.start_date) <= now
    ) || [];

    const futureActivations = pendingSubscriptions?.filter(sub => 
      new Date(sub.start_date) > now
    ) || [];

    // 分析即将过期的订阅
    const readyToExpire = expiringSubscriptions?.filter(sub => 
      new Date(sub.end_date) < now
    ) || [];

    const futureExpirations = expiringSubscriptions?.filter(sub => 
      new Date(sub.end_date) >= now
    ) || [];

    return NextResponse.json({
      currentTime: now.toISOString(),
      pending: {
        total: pendingSubscriptions?.length || 0,
        readyToActivate: readyToActivate.length,
        futureActivations: futureActivations.length,
        readyToActivateList: readyToActivate
      },
      expiring: {
        total: expiringSubscriptions?.length || 0,
        readyToExpire: readyToExpire.length,
        futureExpirations: futureExpirations.length,
        readyToExpireList: readyToExpire
      }
    });

  } catch (error) {
    console.error('❌ Error in GET activate-pending-subscriptions:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 