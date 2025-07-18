import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import config from "../../../../config";

export const dynamic = "force-dynamic";

// 创建统一的时间格式函数
function getSupabaseTimeString(): string {
  return new Date().toISOString();
}

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const returnUrl = requestUrl.searchParams.get("returnUrl");
  
  // 调试日志
  console.log('🔍 Auth callback - Full URL:', req.url);
  console.log('🔍 Auth callback - code:', code);
  console.log('🔍 Auth callback - returnUrl:', returnUrl);

  if (code) {
    try {
      // 使用正确的auth helpers来处理PKCE流程
      const supabase = createRouteHandlerClient({ cookies });
      
      // 使用auth helpers的exchangeCodeForSession方法，它会自动处理PKCE
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Auth exchange error:', error);
        return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl + '?error=auth_error');
      }

      const { user, session } = data;
      
      // 如果认证成功且有用户信息，确保用户档案存在
      console.log('🔐 Auth callback - exchangeCodeForSession result:', { userId: user?.id, sessionExists: !!session });
      
      if (user && session) {
        try {
          // 尝试创建或更新用户档案
          console.log('🔄 Processing profile for user:', user.id);
          console.log('📋 User metadata:', {
            full_name: user.user_metadata?.full_name,
            name: user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            picture: user.user_metadata?.picture
          });

          // 使用 service role key 创建一个管理员客户端来操作数据库
          const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

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
    } catch (error) {
      console.error('❌ Auth callback processing error:', error);
      return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl + '?error=callback_error');
    }
  }

  // URL to redirect to after sign in process completes
  // 如果有 returnUrl 参数，跳转到该 URL，否则使用默认的 callbackUrl
  const redirectTo = returnUrl 
    ? decodeURIComponent(returnUrl)
    : config.auth.callbackUrl;
  
  // 如果没有 returnUrl 参数，需要通过客户端处理 localStorage
  const needsClientRedirect = !returnUrl;
    
  // 调试日志
  console.log('🔍 Auth callback - redirectTo:', redirectTo);
  console.log('🔍 Auth callback - config.auth.callbackUrl:', config.auth.callbackUrl);
    
  // 确保跳转 URL 是相对路径或同域，防止开放重定向攻击
  // 始终使用请求的origin，这样在开发和生产环境都能正确工作
  const baseUrl = requestUrl.origin;
    
  let finalRedirectUrl;
  
  if (needsClientRedirect) {
    // 如果没有 returnUrl 参数，重定向到一个客户端处理页面
    finalRedirectUrl = baseUrl + '/auth/redirect-handler';
  } else {
    finalRedirectUrl = redirectTo.startsWith('/') 
      ? baseUrl + redirectTo 
      : baseUrl + config.auth.callbackUrl;
  }
    
  console.log('🔍 Auth callback - finalRedirectUrl:', finalRedirectUrl);
  console.log('🔍 Auth callback - needsClientRedirect:', needsClientRedirect);
    
  return NextResponse.redirect(finalRedirectUrl);
}
