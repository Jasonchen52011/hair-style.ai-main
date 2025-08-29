import { createClient } from '@supabase/supabase-js';
import { getIsoTimestr } from "@/lib/time";
import { getSnowId } from "@/lib/hash";
import { Order } from "@/types/order";
import { UserCredits } from "@/types/user";

// 枚举定义保持不变
export enum CreditsTransType {
  NewUser = "new_user", // initial credits for new user
  OrderPay = "order_pay", // user pay for credits
  SystemAdd = "system_add", // system add credits
  Ping = "ping", // cost for ping api
}

export enum CreditsAmount {
  NewUserGet = 10,
  PingCost = 1,
}

// 获取 Supabase 客户端
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// 获取用户有效积分记录
async function getUserValidCredits(user_uuid: string) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseClient()
      .from('credits')
      .select('*')
      .eq('user_uuid', user_uuid)
      .gte('expired_at', now)
      .order('expired_at', { ascending: true });

    if (error) {
      console.error("Error getting user valid credits:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting user valid credits:", error);
    throw error;
  }
}

// 根据订单号查找积分记录
async function findCreditByOrderNo(order_no: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('credits')
      .select('*')
      .eq('order_no', order_no)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding credit by order no:", error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error finding credit by order no:", error);
    throw error;
  }
}

// 插入积分记录
async function insertCredit(creditData: {
  trans_no: string;
  created_at: Date;
  expired_at: Date | null;
  user_uuid: string;
  trans_type: string;
  credits: number;
  order_no: string;
}) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('credits')
      .insert({
        trans_no: creditData.trans_no,
        created_at: creditData.created_at.toISOString(),
        expired_at: creditData.expired_at?.toISOString() || null,
        user_uuid: creditData.user_uuid,
        trans_type: creditData.trans_type,
        credits: creditData.credits,
        order_no: creditData.order_no,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting credit:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error inserting credit:", error);
    throw error;
  }
}

// 获取第一个付费订单（通过user_uuid）
async function getFirstPaidOrderByUserUuid(user_uuid: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('user_uuid', user_uuid)
      .eq('status', 'paid')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting first paid order:", error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error getting first paid order:", error);
    throw error;
  }
}

// 获取用户积分信息
export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  const user_credits: UserCredits = {
    left_credits: 0,
  };

  try {
    const first_paid_order = await getFirstPaidOrderByUserUuid(user_uuid);
    if (first_paid_order) {
      user_credits.is_recharged = true;
    }

    const credits = await getUserValidCredits(user_uuid);
    if (credits && credits.length > 0) {
      credits.forEach((v) => {
        user_credits.left_credits += v.credits || 0;
      });
    }

    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    if (user_credits.left_credits > 0) {
      user_credits.is_pro = true;
    }

    return user_credits;
  } catch (e) {
    console.error("get user credits failed: ", e);
    return user_credits;
  }
}

// 减少积分
export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
}) {
  try {
    let order_no = "";
    let expired_at = "";
    let left_credits = 0;

    const userCredits = await getUserValidCredits(user_uuid);
    if (userCredits && userCredits.length > 0) {
      for (let i = 0, l = userCredits.length; i < l; i++) {
        const credit = userCredits[i];
        left_credits += credit.credits;

        // credit enough for cost
        if (left_credits >= credits) {
          order_no = credit.order_no || "";
          expired_at = credit.expired_at || "";
          break;
        }

        // look for next credit
      }
    }

    const new_credit = {
      trans_no: getSnowId(),
      created_at: new Date(getIsoTimestr()),
      expired_at: expired_at ? new Date(expired_at) : new Date(),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: 0 - credits,
      order_no: order_no,
    };
    
    await insertCredit(new_credit);
  } catch (e) {
    console.error("decrease credits failed: ", e);
    throw e;
  }
}

// 增加积分
export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  order_no,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  order_no?: string;
}) {
  try {
    const new_credit = {
      trans_no: getSnowId(),
      created_at: new Date(getIsoTimestr()),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: credits,
      order_no: order_no || "",
      expired_at: expired_at ? new Date(expired_at) : null,
    };
    
    await insertCredit(new_credit);
  } catch (e) {
    console.error("increase credits failed: ", e);
    throw e;
  }
}

// 为订单更新积分
export async function updateCreditForOrder(order: Order) {
  try {
    const credit = await findCreditByOrderNo(order.order_no);
    if (credit) {
      // order already increased credit
      return;
    }

    await increaseCredits({
      user_uuid: order.user_uuid,
      trans_type: CreditsTransType.OrderPay,
      credits: order.credits,
      expired_at: order.expired_at,
      order_no: order.order_no,
    });
  } catch (e) {
    console.error("update credit for order failed: ", e);
    throw e;
  }
}