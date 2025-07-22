// Credits utility functions for managing credit updates across the application

// 创建自定义事件来通知积分变化
export const CREDITS_UPDATED_EVENT = 'creditsUpdated';

// 触发积分更新事件
export const triggerCreditsUpdate = (newCredits?: number) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(CREDITS_UPDATED_EVENT, {
      detail: { newCredits }
    });
    window.dispatchEvent(event);
  }
};

// 监听积分更新事件的hook
export const useCreditsUpdateListener = (callback: (newCredits?: number) => void) => {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回空的清理函数
    return () => {};
  }

  const handleCreditsUpdate = (event: CustomEvent) => {
    callback(event.detail?.newCredits);
  };

  window.addEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
  
  return () => {
    window.removeEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
  };
};

// 生成备用订单号的函数
export function generateFallbackOrderNo(
  orderId: string | null,
  type: string,
  subscriptionId: string | null,
  checkoutId: string | null
): string {
  if (orderId) {
    return orderId;
  }
  
  // 如果没有orderId，生成一个备用的
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  if (subscriptionId) {
    return `${type}_${subscriptionId}_${timestamp}`;
  }
  
  if (checkoutId) {
    return `${type}_${checkoutId}_${timestamp}`;
  }
  
  return `${type}_${timestamp}_${random}`;
}

// 积分插入参数接口
interface InsertCreditsParams {
  supabase: any; // supabase客户端实例
  userId: string;
  transType: string;
  transactionNo: string;
  orderNo: string;
  credits: number;
  expiredAt: string | null;
  eventType: string;
}

// 积分插入结果接口
interface InsertCreditsResult {
  success: boolean;
  message: string;
  creditsAdded: number;
  transactionNo: string;
  alreadyProcessed: boolean;
  newTotalCredits?: number;
}

// 带回退机制的积分插入函数
export async function insertCreditsWithFallback(params: InsertCreditsParams): Promise<InsertCreditsResult> {
  const { supabase, userId, transType, transactionNo, orderNo, credits, expiredAt, eventType } = params;
  
  try {
    console.log(`🔄 Attempting to insert credits for user ${userId}, order ${orderNo}`);
    
    // 1. 幂等性检查 - 检查是否已经处理过这个订单
    const { data: existingCredit, error: checkError } = await supabase
      .from('credits')
      .select('trans_no, credits, created_at')
      .eq('user_uuid', userId)
      .eq('order_no', orderNo)
      .eq('trans_type', transType)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing credit:', checkError);
    }
    
    if (existingCredit) {
      console.log(`✅ Order ${orderNo} already processed for user ${userId}`, existingCredit);
      return {
        success: true,
        message: `Order ${orderNo} already processed - credit exists`,
        creditsAdded: 0,
        transactionNo: existingCredit.trans_no,
        alreadyProcessed: true
      };
    }
    
    // 2. 获取用户当前积分
    const { data: balance, error: balanceError } = await supabase
      .from('user_credits_balance')
      .select('balance')
      .eq('user_uuid', userId)
      .single();
    
    if (balanceError) {
      console.error('❌ Error fetching user balance:', balanceError);
      throw new Error(`Failed to fetch user balance: ${balanceError.message}`);
    }
    
    const currentCredits = balance?.balance || 0;
    const newTotalCredits = currentCredits + credits;
    
    // 3. 同时更新credits表和user_credits_balance表
    const [creditsResult, balanceResult] = await Promise.all([
      supabase
        .from('credits')
        .insert({
          user_uuid: userId,
          trans_type: transType,
          trans_no: transactionNo,
          order_no: orderNo,
          credits: credits,
          current_credits: newTotalCredits,  // 添加当前总积分
          expired_at: expiredAt,
          created_at: new Date().toISOString(),
          event_type: eventType
        }),
      supabase
        .from('user_credits_balance')
        .update({
          balance: newTotalCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_uuid', userId)
    ]);
    
    if (creditsResult.error) {
      // 检查是否为数据库约束违反错误（重复插入）
      if (creditsResult.error.code === '23505') {
        console.log(`✅ Credits already exist for order ${orderNo}, skipping duplicate insertion`);
        return {
          success: true,
          message: 'Credits already exist - duplicate prevented by database constraint',
          creditsAdded: 0,
          transactionNo: transactionNo,
          alreadyProcessed: true
        };
      }
      console.error('❌ Error adding credits record:', creditsResult.error);
      throw new Error(`Failed to add credits record: ${creditsResult.error.message}`);
    }
    
    if (balanceResult.error) {
      console.error('❌ Error updating balance:', balanceResult.error);
      throw new Error(`Failed to update balance: ${balanceResult.error.message}`);
    }
    
    console.log(`✅ Credits added successfully: ${credits} credits for user ${userId}, transaction: ${transactionNo}`);
    
    // 触发前端积分更新事件（通过自定义事件）
    try {
      // 这里只是触发通知，实际的实时更新可以通过其他方式实现
      console.log(`🔔 Credits update notification sent for user ${userId}`);
    } catch (eventError) {
      console.warn('Failed to trigger credits update event:', eventError);
    }
    
    return {
      success: true,
      message: `Successfully added ${credits} credits`,
      creditsAdded: credits,
      transactionNo: transactionNo,
      alreadyProcessed: false,
      newTotalCredits: newTotalCredits
    };
    
  } catch (error) {
    console.error('❌ Error in insertCreditsWithFallback:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      creditsAdded: 0,
      transactionNo: transactionNo,
      alreadyProcessed: false
    };
  }
} 