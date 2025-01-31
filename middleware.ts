import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 1. 跳过静态资源和 API 请求
    if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|ico|css|js)$/i) ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    // 2. 获取主机名
    const hostname = request.headers.get('host')
    const url = request.nextUrl.clone()

    // 3. 只处理 www 到非 www 的重定向
    if (hostname?.startsWith('www.')) {
        url.host = hostname.replace('www.', '')
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

// 4. 更精确的匹配规则
export const config = {
    matcher: [
        // 排除静态文件和 API 路由
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
} 