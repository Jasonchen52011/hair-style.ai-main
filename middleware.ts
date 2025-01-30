import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 避免重定向循环
    if (request.nextUrl.pathname.startsWith('/_next') || 
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/static')) {
        return NextResponse.next()
    }

    // 只处理主域名的重定向
    const hostname = request.headers.get('host') || ''
    if (hostname === 'www.hair-style.ai') {
        return NextResponse.redirect(new URL(request.url.replace('www.hair-style.ai', 'hair-style.ai')))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * 1. /api/* (API routes)
         * 2. /_next/* (Next.js internals)
         * 3. /static/* (static files)
         * 4. /*.* (files with extensions)
         */
        '/((?!api|_next|static|.*\\..*).*)'
    ]
} 