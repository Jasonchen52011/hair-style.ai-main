import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import config from "../../../../config";

export const dynamic = "force-dynamic";

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
      const supabase = await createClient();
      
      // 使用auth helpers的exchangeCodeForSession方法，它会自动处理PKCE
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Auth exchange error:', error);
        return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl + '?error=auth_error');
      }

      const { user, session } = data;
      
      // 检查cookies是否正确设置
      console.log('🍪 Session cookies after exchange:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
        userId: user?.id
      });
      
      // 如果认证成功且有用户信息，确保用户档案存在
      console.log('🔐 Auth callback - exchangeCodeForSession result:', { userId: user?.id, sessionExists: !!session });
      
      if (user && session) {
        try {
          // 尝试创建或更新用户数据到users表和profiles表
          console.log('🔄 Processing user for:', user.id, user.email);
          console.log('📋 User metadata:', {
            full_name: user.user_metadata?.full_name,
            name: user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            picture: user.user_metadata?.picture
          });

          // 导入必要的函数来保存到users表
          const { db } = await import('@/db');
          const { users } = await import('@/db/schema');
          const { eq } = await import('drizzle-orm');
          const { insertUser, findUserByEmail } = await import('@/models/user');
          const { createOrUpdateUserCreditsBalance } = await import('@/models/userCreditsBalance');

          // 同时确保profiles表中有记录
          await ensureUserProfile(user, supabase);

          // 添加重试逻辑
          let existingUser = null;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              // 检查用户是否已存在
              existingUser = await findUserByEmail(user.email!);
              break; // 成功则跳出循环
            } catch (error: any) {
              retryCount++;
              console.log(`⚠️ Database connection attempt ${retryCount}/${maxRetries} failed:`, error.message);
              
              if (retryCount >= maxRetries) {
                throw error; // 重试次数用完，抛出错误
              }
              
              // 等待一段时间后重试
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }

          if (existingUser) {
            // 用户已存在，更新基本信息
            console.log('👤 Updating existing user for:', user.id);
            
            const [updatedUser] = await db()
              .update(users)
              .set({
                nickname: user.user_metadata?.full_name || user.user_metadata?.name || existingUser.nickname,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || existingUser.avatar_url,
                updated_at: new Date(),
              })
              .where(eq(users.email, user.email!))
              .returning();

            console.log('✅ Updated existing user:', updatedUser);
          } else {
            // 用户不存在，创建新用户
            console.log('👤 Creating new user for:', user.id);
            
            const userData = {
              uuid: user.id, // 使用Supabase Auth的用户ID作为UUID
              email: user.email!,
              nickname: user.user_metadata?.full_name || user.user_metadata?.name || '',
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
              signin_type: 'oauth',
              signin_provider: 'google',
              signin_openid: user.id,
              created_at: new Date(),
            };

            console.log('📋 User data to insert:', userData);

            // 添加重试逻辑创建新用户
            let newUser = null;
            retryCount = 0;
            
            while (retryCount < maxRetries) {
              try {
                newUser = await insertUser(userData as any);
                console.log('✅ Created new user:', newUser);
                break;
              } catch (error: any) {
                retryCount++;
                console.log(`⚠️ User creation attempt ${retryCount}/${maxRetries} failed:`, error.message);
                
                if (retryCount >= maxRetries) {
                  throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              }
            }

            // 为新用户创建初始积分余额
            if (newUser) {
              retryCount = 0;
              while (retryCount < maxRetries) {
                try {
                  await createOrUpdateUserCreditsBalance(user.id, 0);
                  console.log('✅ Created initial credits balance for user');
                  break;
                } catch (error: any) {
                  retryCount++;
                  console.log(`⚠️ Credits balance creation attempt ${retryCount}/${maxRetries} failed:`, error.message);
                  
                  if (retryCount >= maxRetries) {
                    // 积分创建失败不应阻止用户登录
                    console.error('❌ Failed to create initial credits balance after retries');
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }
            }
          }
        } catch (userError) {
          console.error('❌ Critical error in user creation process:', userError);
          // 不要让用户创建失败影响认证流程，但要记录详细错误
          console.error('❌ User ID:', user.id);
          console.error('❌ User email:', user.email);
          console.error('❌ User metadata:', user.user_metadata);
          
          // 可选：设置一个标志表示用户创建失败，但不阻止用户登录
          console.log('⚠️ User logged in but user record creation failed - user may need to retry');
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
    
  // 创建响应对象
  const response = NextResponse.redirect(finalRedirectUrl);
  
  // 确保 cookies 被正确设置
  // Supabase SSR 应该已经处理了 cookies，但我们可以添加一些头信息来调试
  response.headers.set('X-Auth-Success', 'true');
  
  return response;
}

// 确保用户在profiles表中有记录
async function ensureUserProfile(user: any, supabase: any) {
  try {
    console.log('🔄 Ensuring user profile exists for:', user.id);
    
    // 检查profiles表中是否已有记录
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (existingProfile) {
      console.log('✅ Profile already exists, updating...');
      
      // 更新现有profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.name,
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture || existingProfile.image,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();
      
      if (updateError) {
        console.error('❌ Failed to update profile:', updateError);
      } else {
        console.log('✅ Profile updated successfully');
      }
    } else {
      console.log('👤 Creating new profile for user:', user.id);
      
      // 创建新的profile记录
      const profileData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        image: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        has_access: false,
        current_credits: 0,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError);
        throw createError;
      } else {
        console.log('✅ Profile created successfully:', newProfile);
      }
    }
  } catch (error) {
    console.error('❌ Error in ensureUserProfile:', error);
    // 不要让profile创建失败阻止用户登录，但要记录错误
  }
}
