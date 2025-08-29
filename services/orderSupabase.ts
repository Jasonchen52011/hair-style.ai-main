import {
  CreditsTransType,
  increaseCredits,
  updateCreditForOrder,
} from "./creditSupabase";
import { getIsoTimestr } from "@/lib/time";
import Stripe from "stripe";
import { updateAffiliateForOrder } from "./affiliateSupabase";
import { Order } from "@/types/order";
import { createClient } from '@supabase/supabase-js';

// 订单状态枚举
export enum OrderStatus {
  Created = "created",
  Paid = "paid", 
  Deleted = "deleted",
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

export async function insertOrder(data: {
  order_no: string;
  user_uuid?: string;
  user_email?: string;
  amount: number;
  credits: number;
  status: string;
  stripe_session_id?: string;
  order_detail?: string;
  paid_at?: Date;
  paid_email?: string;
  paid_detail?: string;
  sub_id?: string;
  sub_interval_count?: number;
  sub_cycle_anchor?: number;
  sub_period_end?: number;
  sub_period_start?: number;
  sub_times?: number;
  expired_at?: string;
}) {
  try {
    const { data: order, error } = await getSupabaseClient()
      .from('orders')
      .insert({
        order_no: data.order_no,
        user_uuid: data.user_uuid,
        user_email: data.user_email,
        amount: data.amount,
        credits: data.credits,
        status: data.status,
        stripe_session_id: data.stripe_session_id,
        order_detail: data.order_detail,
        paid_at: data.paid_at?.toISOString(),
        paid_email: data.paid_email,
        paid_detail: data.paid_detail,
        sub_id: data.sub_id,
        sub_interval_count: data.sub_interval_count,
        sub_cycle_anchor: data.sub_cycle_anchor,
        sub_period_end: data.sub_period_end,
        sub_period_start: data.sub_period_start,
        sub_times: data.sub_times,
        expired_at: data.expired_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting order:", error);
      throw error;
    }

    return order;
  } catch (error) {
    console.error("Error inserting order:", error);
    throw error;
  }
}

export async function findOrderByOrderNo(
  order_no: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('order_no', order_no)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding order by order no:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("Error finding order by order no:", error);
    throw error;
  }
}

export async function getFirstPaidOrderByUserUuid(
  user_uuid: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('user_uuid', user_uuid)
      .eq('status', OrderStatus.Paid)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting first paid order by user uuid:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("Error getting first paid order by user uuid:", error);
    throw error;
  }
}

export async function getFirstPaidOrderByUserEmail(
  user_email: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('user_email', user_email)
      .eq('status', OrderStatus.Paid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting first paid order by user email:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("Error getting first paid order by user email:", error);
    throw error;
  }
}

export async function updateOrderStatus(
  order_no: string,
  status: string,
  paid_at: string,
  paid_email: string,
  paid_detail: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .update({ 
        status, 
        paid_at: new Date(paid_at).toISOString(), 
        paid_detail, 
        paid_email,
        updated_at: new Date().toISOString()
      })
      .eq('order_no', order_no)
      .select()
      .single();

    if (error) {
      console.error("Error updating order status:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

export async function updateOrderSession(
  order_no: string,
  stripe_session_id: string,
  order_detail: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .update({ 
        stripe_session_id, 
        order_detail,
        updated_at: new Date().toISOString()
      })
      .eq('order_no', order_no)
      .select()
      .single();

    if (error) {
      console.error("Error updating order session:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating order session:", error);
    throw error;
  }
}

export async function updateOrderSubscription(
  order_no: string,
  sub_id: string,
  sub_interval_count: number,
  sub_cycle_anchor: number,
  sub_period_end: number,
  sub_period_start: number,
  status: string,
  paid_at: string,
  sub_times: number,
  paid_email: string,
  paid_detail: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .update({
        sub_id,
        sub_interval_count,
        sub_cycle_anchor,
        sub_period_end,
        sub_period_start,
        status,
        paid_at: new Date(paid_at).toISOString(),
        sub_times,
        paid_email,
        paid_detail,
        updated_at: new Date().toISOString()
      })
      .eq('order_no', order_no)
      .select()
      .single();

    if (error) {
      console.error("Error updating order subscription:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating order subscription:", error);
    throw error;
  }
}

export async function getOrdersByUserUuid(
  user_uuid: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('user_uuid', user_uuid)
      .eq('status', OrderStatus.Paid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error getting orders by user uuid:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("Error getting orders by user uuid:", error);
    throw error;
  }
}

export async function getOrdersByUserEmail(
  user_email: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('user_email', user_email)
      .eq('status', OrderStatus.Paid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error getting orders by user email:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("Error getting orders by user email:", error);
    throw error;
  }
}

export async function getOrdersByPaidEmail(
  paid_email: string
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('paid_email', paid_email)
      .eq('status', OrderStatus.Paid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error getting orders by paid email:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("Error getting orders by paid email:", error);
    throw error;
  }
}

export async function getPaiedOrders(
  page: number,
  limit: number
) {
  try {
    const offset = (page - 1) * limit;

    const { data, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('status', OrderStatus.Paid)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error getting paid orders:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("Error getting paid orders:", error);
    throw error;
  }
}

export async function getPaidOrdersTotal(): Promise<number | undefined> {
  try {
    const { count, error } = await getSupabaseClient()
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', OrderStatus.Paid);

    if (error) {
      console.error("Error getting paid orders total:", error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error getting paid orders total:", error);
    throw error;
  }
}

export async function getOrderCountByDate(
  startTime: string,
  status?: string
): Promise<Map<string, number> | undefined> {
  try {
    let query = getSupabaseClient()
      .from('orders')
      .select('created_at')
      .gte('created_at', new Date(startTime).toISOString());

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error getting order count by date:", error);
      throw error;
    }

    if (!data) {
      return undefined;
    }

    // Sort data by created_at
    data.sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());

    const dateCountMap = new Map<string, number>();
    data.forEach((item) => {
      const date = item.created_at!.split("T")[0];
      dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
    });

    return dateCountMap;
  } catch (error) {
    console.error("Error getting order count by date:", error);
    throw error;
  }
}

// 创建一个更新affiliate的函数
async function updateAffiliateForOrderSupabase(order: Order) {
  try {
    const user = await findUserByUuid(order.user_uuid);
    if (user && user.uuid && user.invited_by && user.invited_by !== user.uuid) {
      const affiliate = await findAffiliateByOrderNo(order.order_no);
      if (affiliate) {
        return;
      }

      const { AffiliateRewardAmount, AffiliateRewardPercent, AffiliateStatus } = await import("./constant");

      await insertAffiliate({
        user_uuid: user.uuid,
        invited_by: user.invited_by,
        created_at: new Date(),
        status: AffiliateStatus.Completed,
        paid_order_no: order.order_no,
        paid_amount: order.amount,
        reward_percent: AffiliateRewardPercent.Paied,
        reward_amount: AffiliateRewardAmount.Paied,
      });
    }
  } catch (e) {
    console.log("update affiliate for order failed: ", e);
    throw e;
  }
}

// 查找用户的函数
async function findUserByUuid(uuid: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .select('*')
      .eq('uuid', uuid)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding user by uuid:", error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error finding user by uuid:", error);
    throw error;
  }
}

// 查找affiliate的函数
async function findAffiliateByOrderNo(order_no: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('affiliates')
      .select('*')
      .eq('paid_order_no', order_no)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding affiliate by order no:", error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error finding affiliate by order no:", error);
    throw error;
  }
}

// 插入affiliate的函数
async function insertAffiliate(data: {
  user_uuid: string;
  invited_by: string;
  created_at: Date;
  status: string;
  paid_order_no: string;
  paid_amount: number;
  reward_percent: number;
  reward_amount: number;
}) {
  try {
    const { data: affiliate, error } = await getSupabaseClient()
      .from('affiliates')
      .insert({
        user_uuid: data.user_uuid,
        invited_by: data.invited_by,
        created_at: data.created_at.toISOString(),
        status: data.status,
        paid_order_no: data.paid_order_no,
        paid_amount: data.paid_amount,
        reward_percent: data.reward_percent,
        reward_amount: data.reward_amount,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting affiliate:", error);
      throw error;
    }

    return affiliate;
  } catch (error) {
    console.error("Error inserting affiliate:", error);
    throw error;
  }
}

export async function handleOrderSession(session: Stripe.Checkout.Session) {
  try {
    if (
      !session ||
      !session.metadata ||
      !session.metadata.order_no ||
      session.payment_status !== "paid"
    ) {
      throw new Error("invalid session");
    }

    const order_no = session.metadata.order_no;
    const paid_email =
      session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);

    const order = await findOrderByOrderNo(order_no);
    if (!order || order.status !== OrderStatus.Created) {
      throw new Error("invalid order");
    }

    const paid_at = getIsoTimestr();
    await updateOrderStatus(
      order_no,
      OrderStatus.Paid,
      paid_at,
      paid_email,
      paid_detail
    );

    if (order.user_uuid) {
      if (order.credits > 0) {
        // increase credits for paied order
        await updateCreditForOrder(order as unknown as Order);
      }

      // update affiliate for paied order
      await updateAffiliateForOrderSupabase(order as unknown as Order);
    }

    console.log(
      "handle order session successed: ",
      order_no,
      paid_at,
      paid_email,
      paid_detail
    );
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}