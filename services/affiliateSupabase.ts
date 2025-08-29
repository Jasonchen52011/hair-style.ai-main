import { createClient } from '@supabase/supabase-js';

// 获取 Supabase 客户端
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// 根据uuid查找用户
export async function findUserByUuid(uuid: string) {
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

export async function insertAffiliate(data: {
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

export async function findAffiliateByUserUuid(user_uuid: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('affiliates')
      .select('*')
      .eq('user_uuid', user_uuid)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding affiliate by user uuid:", error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error finding affiliate by user uuid:", error);
    throw error;
  }
}

export async function getAffiliatesByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
) {
  try {
    const offset = (page - 1) * limit;

    const { data, error } = await getSupabaseClient()
      .from('affiliates')
      .select('*')
      .eq('invited_by', user_uuid)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error getting affiliates by user uuid:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return undefined;
    }

    // Note: In Supabase version, we don't join with users table here
    // This would require additional queries if user info is needed
    return data;
  } catch (error) {
    console.error("Error getting affiliates by user uuid:", error);
    throw error;
  }
}

export async function getAffiliateSummary(user_uuid: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('affiliates')
      .select('*')
      .eq('invited_by', user_uuid);

    if (error) {
      console.error("Error getting affiliate summary:", error);
      throw error;
    }

    const summary = {
      total_invited: 0,
      total_paid: 0,
      total_reward: 0,
    };

    if (!data) {
      return summary;
    }

    const invited_users = new Set();
    const paid_users = new Set();

    data.forEach((item) => {
      invited_users.add(item.user_uuid);
      if (item.paid_amount > 0) {
        paid_users.add(item.user_uuid);
        summary.total_reward += item.reward_amount;
      }
    });

    summary.total_invited = invited_users.size;
    summary.total_paid = paid_users.size;

    return summary;
  } catch (error) {
    console.error("Error getting affiliate summary:", error);
    throw error;
  }
}

export async function findAffiliateByOrderNo(order_no: string) {
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

export async function getAllAffiliates(
  page: number = 1,
  limit: number = 50
) {
  try {
    const offset = (page - 1) * limit;

    const { data, error } = await getSupabaseClient()
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error getting all affiliates:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return undefined;
    }

    // Note: In Supabase version, we don't join with users table here
    // This would require additional queries if user info is needed
    return data;
  } catch (error) {
    console.error("Error getting all affiliates:", error);
    throw error;
  }
}