import {
  AffiliateRewardAmount,
  AffiliateRewardPercent,
  AffiliateStatus,
} from "@/services/constant";
import { respData, respErr } from "@/lib/resp";
import { getIsoTimestr } from "@/lib/time";
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
    const { invite_code, user_uuid } = await req.json();
    if (!invite_code || !user_uuid) {
      return respErr("invalid params");
    }

    const supabaseAdmin = getSupabaseClient();
    
    // check invite user
    const { data: inviteUser, error: inviteError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('invite_code', invite_code)
      .single();
      
    if (inviteError || !inviteUser) {
      return respErr("invite user not found");
    }

    // check current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('uuid', user_uuid)
      .single();
      
    if (userError || !user) {
      return respErr("user not found");
    }

    if (user.uuid === inviteUser.uuid || user.email === inviteUser.email) {
      return respErr("can't invite yourself");
    }

    if (user.invited_by) {
      return respErr("user already has invite user");
    }

    // update invite user uuid
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        invited_by: inviteUser.uuid,
        updated_at: new Date().toISOString(),
      })
      .eq('uuid', user_uuid)
      .select()
      .single();
      
    if (updateError) {
      throw updateError;
    }

    // insert affiliate record
    const { error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .insert({
        user_uuid: user_uuid,
        invited_by: inviteUser.uuid,
        created_at: new Date().toISOString(),
        status: AffiliateStatus.Pending,
        paid_order_no: "",
        paid_amount: 0,
        reward_percent: AffiliateRewardPercent.Invited,
        reward_amount: AffiliateRewardAmount.Invited,
      });
      
    if (affiliateError) {
      throw affiliateError;
    }

    return respData(updatedUser);
  } catch (e) {
    console.error("update invited by failed: ", e);
    return respErr("update invited by failed");
  }
}
