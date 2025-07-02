import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware((auth, req) => {
  // 避免重定向循环，跳过静态资源和API请求
  if (req.nextUrl.pathname.startsWith('/_next') || 
      req.nextUrl.pathname.startsWith('/static') ||
      req.nextUrl.pathname.includes('.')) {
      return NextResponse.next()
  }

  // 只处理www到非www的重定向
  const hostname = req.headers.get('host') || ''
  if (hostname === 'www.hair-style.ai') {
      return NextResponse.redirect(
          `https://hair-style.ai${req.nextUrl.pathname}${req.nextUrl.search}`
      )
  }

  return NextResponse.next()
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ],
} 