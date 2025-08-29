import { respData, respErr, respJson } from "@/lib/resp";

// 使用内联的Supabase查询替代findUserByUuid
import { createClient } from '@supabase/supabase-js';
import { getUserUuid } from "@/services/userSupabase";
import { getUserCredits } from "@/services/creditSupabase";
import { User } from "@/types/user";

export const runtime = "edge";

// 获取 Supabase 客户端的函数
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    // 使用Supabase查询用户信息
    const { data: dbUser, error } = await getSupabaseClient()
      .from('users')
      .select('*')
      .eq('uuid', user_uuid)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error finding user:", error);
      throw error;
    }
    
    if (!dbUser) {
      return respErr("user not exist");
    }

    const userCredits = await getUserCredits(user_uuid);

    const user = {
      ...(dbUser as unknown as User),
      credits: userCredits,
    };

    return respData(user);
  } catch (e) {
    console.log("get user info failed: ", e);
    return respErr("get user info failed");
  }
}
