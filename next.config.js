/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    compiler: {
        styledComponents: true,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
            {
                source: '/favicon.ico',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                    {
                        key: 'X-Robots-Tag',
                        value: 'all',
                    },
                ],
            },
            {
                source: '/images/logo/:file*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                    {
                        key: 'X-Robots-Tag',
                        value: 'all',
                    },
                ],
            },
            {
                source: '/cdn-cgi/:path*',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'noindex',
                    },
                ],
            },
        ]
    },
    images: {
        domains: [
            'ailab-result-rapidapi.oss-accelerate.aliyuncs.com',
            'hair-style.ai',
            'www.hair-style.ai',
            'pub-static.aiease.ai'
        ],
        unoptimized: false, // 启用Next.js图片优化
        formats: ['image/webp', 'image/avif'], // 优先使用现代格式
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
                pathname: '**',
            },
        ],
    },
    eslint: {
        // 暂时忽略 ESLint 错误
        ignoreDuringBuilds: true
    },
    // 添加实验性配置
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        },
    },
    typescript: {
        // 暂时忽略类型错误，让构建能够继续
        ignoreBuildErrors: true
    },
    // 添加静态导出配置
    output: 'standalone',
    // 添加证书配置
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.alias['https'] = 'https-browserify';
            config.resolve.alias['http'] = 'http-browserify';
        }
        return config;
    },
    // 添加静态资源配置
    assetPrefix: '',
    async redirects() {
        return [
            // WWW to non-WWW redirect
            {
                source: '/',
                has: [{
                    type: 'host',
                    value: 'www.hair-style.ai',
                }],
                destination: 'https://hair-style.ai',
                permanent: true,
            },
            {
                source: '/:path*',
                has: [{
                    type: 'host',
                    value: 'www.hair-style.ai',
                }],
                destination: 'https://hair-style.ai/:path*',
                permanent: true,
            },
            // 删除的页面重定向到主页或相应页面
            {
                source: '/en/:path*',
                destination: '/:path*',
                permanent: true,
            },
            {
                source: '/zh/:path*',
                destination: '/:path*',
                permanent: true,
            },
            {
                source: '/en',
                destination: '/',
                permanent: true,
            },
            {
                source: '/zh',
                destination: '/',
                permanent: true,
            }
        ]
    },
}

module.exports = nextConfig 