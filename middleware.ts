import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/debug/images/')) {
        // 使用 URL 而不是 path.join
        const url = new URL(request.nextUrl.pathname, request.url)
        return NextResponse.rewrite(url)
    }
}

export const config = {
    matcher: '/debug/images/:path*',
} 