import { createClient } from '@supabase/supabase-js';
import { CreditsAmount, CreditsTransType, increaseCredits } from "./creditSupabase";
import { User } from "@/types/user";
import { getOneYearLaterTimestr } from "@/lib/time";
import { headers } from "next/headers";
import { getUuid } from "@/lib/hash";

// 获取 Supabase 客户端
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// 根据email查找用户
async function findUserByEmail(email: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error finding user by email:", error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
}

// 根据uuid查找用户
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

// 插入用户
async function insertUser(userData: {
  uuid: string;
  email?: string;
  name?: string;
  image?: string;
  invite_code?: string;
  invited_by?: string;
}) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .insert({
        uuid: userData.uuid,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        invite_code: userData.invite_code,
        invited_by: userData.invited_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting user:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error inserting user:", error);
    throw error;
  }
}

// 根据API Key获取用户UUID
async function getUserUuidByApiKey(apiKey: string): Promise<string | undefined> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('apikeys')
      .select('user_uuid')
      .eq('api_key', apiKey)
      .eq('status', 'created')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error getting user uuid by api key:", error);
      throw error;
    }

    return data?.user_uuid || undefined;
  } catch (error) {
    console.error("Error getting user uuid by api key:", error);
    return undefined;
  }
}

// save user to database, if user not exist, create a new user
export async function saveUser(user: User) {
  try {
    if (!user.email) {
      throw new Error("invalid user email");
    }

    const existUser = await findUserByEmail(user.email);

    if (!existUser) {
      // user not exist, create a new user
      if (!user.uuid) {
        user.uuid = getUuid();
      }

      console.log("user to be inserted:", user);

      const dbUser = await insertUser(user);

      // increase credits for new user, expire in one year
      await increaseCredits({
        user_uuid: user.uuid,
        trans_type: CreditsTransType.NewUser,
        credits: CreditsAmount.NewUserGet,
        expired_at: getOneYearLaterTimestr(),
      });

      user = {
        ...dbUser,
      };
    } else {
      // user exist, return user info in db
      user = {
        ...existUser,
      };
    }

    return user;
  } catch (e) {
    console.error("save user failed: ", e);
    throw e;
  }
}

export async function getUserUuid() {
  let user_uuid = "";

  const token = await getBearerToken();

  if (token) {
    // api key
    if (token.startsWith("sk-")) {
      const user_uuid = await getUserUuidByApiKey(token);

      return user_uuid || "";
    }
  }

  // 使用 Supabase Auth 获取用户
  try {
    const { createServerComponentClient } = await import("@supabase/auth-helpers-nextjs");
    const { cookies } = await import("next/headers");
    
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      user_uuid = user.id;
    }
  } catch (error) {
    console.error("Error getting user UUID:", error);
  }

  return user_uuid;
}

export async function getBearerToken() {
  const h = await headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  return auth.replace("Bearer ", "");
}

export async function getUserEmail() {
  let user_email = "";

  // 使用 Supabase Auth 获取用户
  try {
    const { createServerComponentClient } = await import("@supabase/auth-helpers-nextjs");
    const { cookies } = await import("next/headers");
    
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && user.email) {
      user_email = user.email;
    }
  } catch (error) {
    console.error("Error getting user email:", error);
  }

  return user_email;
}

export async function getUserInfo() {
  const user_uuid = await getUserUuid();

  if (!user_uuid) {
    return;
  }

  const user = await findUserByUuid(user_uuid);

  return user;
}