import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function handleRequest(req: NextRequest) {
  // 避免重定向循环，跳过静态资源和API请求
  if (req.nextUrl.pathname.startsWith('/_next') || 
      req.nextUrl.pathname.startsWith('/static') ||
      req.nextUrl.pathname.includes('.')) {
      return NextResponse.next()
  }

  return NextResponse.next()
}

export default handleRequest;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ],
} 