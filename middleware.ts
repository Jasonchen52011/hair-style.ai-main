import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 避免重定向循环，跳过静态资源和 API 请求
    if (request.nextUrl.pathname.startsWith('/_next') || 
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.includes('.')) {
        return NextResponse.next()
    }

    // 只处理 www 到非 www 的重定向
    const hostname = request.headers.get('host') || ''
    if (hostname === 'www.hair-style.ai') {
        return NextResponse.redirect(
            `https://hair-style.ai${request.nextUrl.pathname}${request.nextUrl.search}`
        )
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/((?!_next/static|_next/image|favicon.ico).*)'
} 