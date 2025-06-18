import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Avoid redirect loops, skip static resources and API requests
    if (request.nextUrl.pathname.startsWith('/_next') || 
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.includes('.')) {
        return NextResponse.next()
    }

    // Only handle www to non-www redirects
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