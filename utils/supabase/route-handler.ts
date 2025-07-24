import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * 创建用于 Route Handler 的 Supabase 客户端
 * 兼容新版本的 @supabase/ssr
 */
export async function createRouteClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * 兼容旧版本的 createRouteHandlerClient 调用方式
 * @deprecated 请使用 createRouteClient
 */
export function createRouteHandlerClient({ cookies: getCookies }: { cookies: () => any }) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieStore = getCookies()
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            const cookieStore = getCookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Ignore errors
          }
        },
      },
    }
  )
}