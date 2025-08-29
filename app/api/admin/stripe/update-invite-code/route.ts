import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/userSupabase";
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { invite_code } = await req.json();
    if (!invite_code) {
      return respErr("invalid params");
    }

    if (invite_code.length < 2 || invite_code.length > 16) {
      return respErr("invalid invite code, length must be between 2 and 16");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const supabaseAdmin = getSupabaseClient();
    
    // 查找用户
    const { data: user_info, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('uuid', user_uuid)
      .single();
      
    if (userError || !user_info || !user_info.email) {
      return respErr("invalid user");
    }

    if (user_info.invite_code === invite_code) {
      return respData(user_info);
    }

    // 查找是否已存在该邀请码
    const { data: user_by_invite_code } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('invite_code', invite_code)
      .single();
      
    if (user_by_invite_code) {
      if (user_by_invite_code.uuid !== user_uuid) {
        return respErr("invite code already exists");
      }

      return respData(user_by_invite_code);
    }

    // 更新邀请码
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        invite_code,
        updated_at: new Date().toISOString(),
      })
      .eq('uuid', user_uuid)
      .select()
      .single();
      
    if (updateError) {
      throw updateError;
    }

    return respData(updatedUser);
  } catch (e) {
    console.log("update invite code failed", e);
    return respErr("update invite code failed");
  }
}
