import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { IP_CONFIG } from './config/ip-config'

// 使用 Map 在内存中存储请求计数
const requestCounts = new Map<string, { count: number; date: string }>()

export function middleware(request: NextRequest) {
    // 避免重定向循环，跳过静态资源和 API 请求
    if (request.nextUrl.pathname.startsWith('/_next') || 
        request.nextUrl.pathname.startsWith('/api') ||
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

    // 获取客户端 IP
    const ip = request.ip || request.headers.get('x-real-ip') || '0.0.0.0'
    
    // 检查白名单
    if (IP_CONFIG.WHITELIST_IPS.includes(ip)) {
        return NextResponse.next()
    }

    const today = new Date().toISOString().split('T')[0]
    const currentCount = requestCounts.get(ip)

    // 如果是新的一天，重置计数
    if (!currentCount || currentCount.date !== today) {
        requestCounts.set(ip, { count: 1, date: today })
        return NextResponse.next()
    }

    // 检查是否超过限制
    if (currentCount.count >= IP_CONFIG.DAILY_LIMIT) {
        return new NextResponse(
            JSON.stringify({
                success: false,
                error: 'You have reached your daily limit of 5 free generations. Please try again tomorrow.'
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    }

    // 增加计数
    requestCounts.set(ip, { 
        count: currentCount.count + 1, 
        date: today 
    })

    return NextResponse.next()
}

export const config = {
    matcher: '/((?!_next/static|_next/image|favicon.ico).*)'
} 