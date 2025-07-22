import { createClient } from '@supabase/supabase-js';
import { getProductPlanMap } from '../config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SubscriptionTransition {
  type: 'upgrade' | 'downgrade' | 'new' | 'none';
  currentPlan?: string;
  newPlan: string;
  effectiveDate: 'immediate' | string; // ISO date string for delayed activation
  creditsHandling: 'preserve' | 'add' | 'transfer';
  message: string;
}

export interface CreditTransferResult {
  currentCredits: number;
  addedCredits: number;
  finalCredits: number;
  expirationDate?: string;
  transactionNo: string;
}

/**
 * 分析订阅转换类型
 */
export function analyzeSubscriptionTransition(
  currentPlan: string | null,
  newPlan: string
): SubscriptionTransition {
  // 新用户
  if (!currentPlan) {
    return {
      type: 'new',
      newPlan,
      effectiveDate: 'immediate',
      creditsHandling: 'add',
      message: generateTransitionMessage('new', newPlan)
    };
  }

  // 月转年（升级）
  if (currentPlan === 'monthly' && newPlan === 'yearly') {
    return {
      type: 'upgrade',
      currentPlan,
      newPlan,
      effectiveDate: 'immediate',
      creditsHandling: 'add',
      message: generateTransitionMessage('upgrade', newPlan, currentPlan)
    };
  }

  // 年转月（降级）
  if (currentPlan === 'yearly' && newPlan === 'monthly') {
    return {
      type: 'downgrade',
      currentPlan,
      newPlan,
      effectiveDate: 'delayed', // 具体日期需要从当前订阅获取
      creditsHandling: 'preserve',
      message: generateTransitionMessage('downgrade', newPlan, currentPlan)
    };
  }

  // 相同套餐
  if (currentPlan === newPlan) {
    return {
      type: 'none',
      currentPlan,
      newPlan,
      effectiveDate: 'immediate',
      creditsHandling: 'preserve',
      message: generateTransitionMessage('none', newPlan, currentPlan)
    };
  }

  // 其他情况
  return {
    type: 'none',
    currentPlan,
    newPlan,
    effectiveDate: 'immediate',
    creditsHandling: 'preserve',
    message: 'Invalid subscription transition'
  };
}

/**
 * 生成订阅转换消息
 */
function generateTransitionMessage(
  type: 'upgrade' | 'downgrade' | 'new' | 'none',
  newPlan: string,
  currentPlan?: string
): string {
  switch (type) {
    case 'upgrade':
      return 'Your annual plan will start immediately. Your remaining monthly credits will be preserved and additional yearly credits will be added.';
    
    case 'downgrade':
      return 'Your monthly plan will take effect after your current annual subscription ends. Your remaining credits will stay available until the transition.';
    
    case 'new':
      return newPlan === 'yearly' 
        ? 'Welcome to the annual plan! You will receive 1000 credits monthly.'
        : 'Welcome to the monthly plan! You will receive 500 credits monthly.';
    
    case 'none':
      return currentPlan === newPlan 
        ? 'You already have this subscription plan.'
        : 'No subscription change needed.';
    
    default:
      return 'Subscription updated successfully.';
  }
}

/**
 * 处理积分转换
 */
export async function handleCreditTransfer(
  userId: string,
  transition: SubscriptionTransition,
  orderId: string,
  currentCredits: number
): Promise<CreditTransferResult> {
  const transactionNo = generateTransactionNo();
  const now = new Date();

  switch (transition.type) {
    case 'upgrade':
      // 月转年：保留现有积分，添加年度积分
      const yearlyCredits = 1000;
      await addCredits(userId, yearlyCredits, 'purchase', transactionNo, orderId, null);
      
      return {
        currentCredits,
        addedCredits: yearlyCredits,
        finalCredits: currentCredits + yearlyCredits,
        transactionNo
      };

    case 'downgrade':
      // 年转月：保留现有积分，不添加新积分
      await addCredits(userId, 0, 'transfer', transactionNo, orderId, null);
      
      return {
        currentCredits,
        addedCredits: 0,
        finalCredits: currentCredits,
        transactionNo
      };

    case 'new':
      // 新订阅：添加相应积分
      const newCredits = transition.newPlan === 'yearly' ? 1000 : 500;
      let expiredAt = null;
      
      if (transition.newPlan === 'monthly') {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setHours(0, 0, 0, 0);
        expiredAt = nextMonth.toISOString();
      }

      await addCredits(userId, newCredits, 'purchase', transactionNo, orderId, expiredAt);
      
      return {
        currentCredits: 0,
        addedCredits: newCredits,
        finalCredits: newCredits,
        expirationDate: expiredAt || undefined,
        transactionNo
      };

    default:
      return {
        currentCredits,
        addedCredits: 0,
        finalCredits: currentCredits,
        transactionNo
      };
  }
}

/**
 * 添加积分记录
 */
async function addCredits(
  userId: string,
  credits: number,
  transType: string,
  transactionNo: string,
  orderId: string,
  expiredAt: string | null
): Promise<void> {
  // 获取当前积分
  const { data: balance, error: balanceError } = await supabase
    .from('user_credits_balance')
    .select('balance')
    .eq('user_uuid', userId)
    .single();

  if (balanceError) {
    throw new Error(`Failed to fetch user balance: ${balanceError.message}`);
  }

  const currentCredits = balance?.balance || 0;

  // 同时更新credits表和user_credits_balance表
  const [creditsResult, balanceResult] = await Promise.all([
    supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: transType,
        trans_no: transactionNo,
        order_no: orderId || `credit_${transactionNo}`,
        credits: credits,
        expired_at: expiredAt,
        created_at: new Date().toISOString(),
        event_type: transType === 'purchase' ? 'subscription.paid' : 'subscription.transfer'
      }),
    supabase
      .from('user_credits_balance')
      .update({
        balance: currentCredits + credits,
        updated_at: new Date().toISOString()
      })
      .eq('user_uuid', userId)
  ]);

  if (creditsResult.error) {
    throw new Error(`Failed to add credits record: ${creditsResult.error.message}`);
  }

  if (balanceResult.error) {
    throw new Error(`Failed to update balance: ${balanceResult.error.message}`);
  }
}

/**
 * 获取用户当前积分
 */
export async function getUserCurrentCredits(userId: string): Promise<number> {
  const { data: balance, error } = await supabase
    .from('user_credits_balance')
    .select('balance')
    .eq('user_uuid', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user balance: ${error.message}`);
  }

  return balance?.balance || 0;
}

/**
 * 获取用户活跃订阅
 */
export async function getUserActiveSubscriptions(userId: string): Promise<any[]> {
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .in('plan_name', ['monthly', 'yearly']);

  if (error) {
    throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  }

  return subscriptions || [];
}

/**
 * 检查订阅冲突
 */
export async function checkSubscriptionConflict(
  userId: string,
  newPlanId: string
): Promise<{
  hasConflict: boolean;
  currentPlan?: string;
  newPlan: string;
  transition: SubscriptionTransition;
}> {
  const planMap = getProductPlanMap();

  const newPlan = planMap[newPlanId];
  if (!newPlan) {
    throw new Error('Invalid product ID');
  }

  const activeSubscriptions = await getUserActiveSubscriptions(userId);
  const currentPlan = activeSubscriptions.length > 0 ? activeSubscriptions[0].plan_name : null;

  const transition = analyzeSubscriptionTransition(currentPlan, newPlan);
  const hasConflict = transition.type === 'upgrade' || transition.type === 'downgrade';

  return {
    hasConflict,
    currentPlan: currentPlan || undefined,
    newPlan,
    transition
  };
}

/**
 * 处理延期激活的订阅
 */
export async function activatePendingSubscriptions(): Promise<void> {
  const now = new Date();
  
  // 查找所有应该激活的待激活订阅
  const { data: pendingSubscriptions, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'pending')
    .lte('start_date', now.toISOString());

  if (fetchError) {
    console.error('Error fetching pending subscriptions:', fetchError);
    return;
  }

  if (!pendingSubscriptions || pendingSubscriptions.length === 0) {
    return;
  }

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
        console.error(`Failed to activate subscription ${subscription.id}:`, updateError);
        continue;
      }

      // 如果是月度订阅，添加初始积分
      if (subscription.plan_name === 'monthly') {
        const transactionNo = generateTransactionNo();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setHours(0, 0, 0, 0);

        await addCredits(
          subscription.user_id,
          500,
          'purchase',
          transactionNo,
          `activation_${subscription.id}`,
          nextMonth.toISOString()
        );
      }

      console.log(`✅ Activated subscription ${subscription.id} for user ${subscription.user_id}`);
    } catch (error) {
      console.error(`Error activating subscription ${subscription.id}:`, error);
    }
  }
}

/**
 * 生成交易编号
 */
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

/**
 * 格式化订阅转换消息
 */
export function formatSubscriptionMessage(
  transition: SubscriptionTransition,
  creditResult: CreditTransferResult
): string {
  const baseMessage = transition.message;
  
  switch (transition.type) {
    case 'upgrade':
      return `${baseMessage} You now have ${creditResult.finalCredits} credits total (${creditResult.currentCredits} existing + ${creditResult.addedCredits} new credits).`;
    
    case 'downgrade':
      return `${baseMessage} You currently have ${creditResult.currentCredits} credits that will remain available.`;
    
    case 'new':
      return `${baseMessage} You now have ${creditResult.finalCredits} credits.`;
    
    default:
      return baseMessage;
  }
} 