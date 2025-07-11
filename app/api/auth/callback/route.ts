import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import config from "../../../../config";

export const dynamic = "force-dynamic";

// 创建统一的时间格式函数
function getSupabaseTimeString(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' });
}

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    // 如果认证成功且有用户信息，确保用户档案存在
    console.log('🔐 Auth callback - exchangeCodeForSession result:', { userId: user?.id, error: error?.message });
    
    if (!error && user) {
      try {
        // 使用 service role key 创建一个管理员客户端来操作数据库
        const { createClient } = await import('@supabase/supabase-js');
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 尝试创建或更新用户档案
        console.log('🔄 Processing profile for user:', user.id);
        console.log('📋 User metadata:', {
          full_name: user.user_metadata?.full_name,
          name: user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
          picture: user.user_metadata?.picture
        });

        // 先检查用户是否已存在 (不使用.single()避免错误)
        const { data: existingProfiles, error: checkError } = await adminSupabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);

        if (checkError) {
          console.error('❌ Error checking existing profile:', checkError);
          throw new Error(`Failed to check existing profile: ${checkError.message}`);
        }

        const existingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;

        if (existingProfile) {
          // 用户已存在，更新基本信息
          console.log('👤 Updating existing profile for:', user.id);
          
          const { data: updatedProfile, error: profileError } = await adminSupabase
            .from('profiles')
            .update({
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              updated_at: getSupabaseTimeString(),
            })
            .eq('id', user.id)
            .select();

          if (profileError) {
            console.error('❌ Error updating existing user profile:', profileError);
            throw new Error(`Failed to update profile: ${profileError.message}`);
          } else {
            console.log('✅ Updated existing user profile:', updatedProfile);
          }
        } else {
          // 用户不存在，创建新档案
          console.log('👤 Creating new profile for:', user.id);
          
          const currentTime = getSupabaseTimeString();
          const profileData = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            has_access: false, // 新用户默认无访问权限
            created_at: currentTime,
            updated_at: currentTime,
          };

          console.log('📋 Profile data to insert:', profileData);

          const { data: newProfile, error: profileError } = await adminSupabase
            .from('profiles')
            .insert(profileData)
            .select();

          if (profileError) {
            console.error('❌ Error creating new user profile:', profileError);
            console.error('📋 Failed with data:', profileData);
            
            // 尝试使用upsert作为备用方案
            console.log('🔄 Trying upsert as fallback...');
            const { data: upsertProfile, error: upsertError } = await adminSupabase
              .from('profiles')
              .upsert(profileData, { onConflict: 'id' })
              .select();
            
            if (upsertError) {
              console.error('❌ Upsert also failed:', upsertError);
              throw new Error(`Failed to create profile: ${profileError.message}. Upsert failed: ${upsertError.message}`);
            } else {
              console.log('✅ Created user profile via upsert:', upsertProfile);
            }
          } else {
            console.log('✅ Created new user profile:', newProfile);
          }
        }
      } catch (profileError) {
        console.error('❌ Critical error in profile creation process:', profileError);
        // 不要让profile创建失败影响认证流程，但要记录详细错误
        console.error('❌ User ID:', user.id);
        console.error('❌ User email:', user.email);
        console.error('❌ User metadata:', user.user_metadata);
        
        // 可选：设置一个标志表示profile创建失败，但不阻止用户登录
        console.log('⚠️ User logged in but profile creation failed - user may need to retry');
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl);
}
