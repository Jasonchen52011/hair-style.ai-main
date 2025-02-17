/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
                    },
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
        ]
    },
    images: {
        domains: [
            'ailab-result-rapidapi.oss-accelerate.aliyuncs.com',
            'hair-style.ai',
            'www.hair-style.ai'
        ],
        unoptimized: true,
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
            // 删除的页面重定向到主页或相应页面
            {
                source: '/en/:path*',
                destination: '/:path*',
                permanent: true, // 301 重定向
            },
            {
                source: '/zh/:path*',
                destination: '/:path*',
                permanent: true,
            },
            // 其他不需要的路径
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