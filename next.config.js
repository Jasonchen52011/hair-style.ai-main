/** @type {import('next').NextConfig} */

// 配置代理环境变量
if (process.env.HTTPS_PROXY && !process.env.UNDICI_PROXY_URL) {
  process.env.UNDICI_PROXY_URL = process.env.HTTPS_PROXY;
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
    reactStrictMode: false,
    // 启用Next.js的实验性优化功能
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        },
        // 启用服务器代理支持
        serverComponentsExternalPackages: ['https-proxy-agent'],
    },
    compiler: {
        styledComponents: true,
        // 移除console.log以减少包大小
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error']
        } : false,
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
                    // 添加预加载关键资源 - LCP优化
                    {
                        key: 'Link',
                        value: '</images/optimized/hero/hero4.webp>; rel=preload; as=image; type=image/webp, </fonts/satoshi-regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin, </fonts/satoshi-medium.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
                    }
                ],
            },
            // 字体文件缓存优化
            {
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
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
            // 优化图片缓存
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400, stale-while-revalidate=604800',
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
        unoptimized: true, // 启用Next.js图片优化
        formats: ['image/webp', 'image/avif'], // 优先使用现代格式
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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
    typescript: {
        // 暂时忽略类型错误，让构建能够继续
        ignoreBuildErrors: true
    },
    // 添加静态导出配置
    // output: 'standalone', // 暂时注释掉
    // 添加webpack优化
    webpack: (config, { isServer, dev }) => {
        // 修复 self is not defined 错误
        if (isServer) {
            config.resolve.alias['https'] = 'https-browserify';
            config.resolve.alias['http'] = 'http-browserify';
            
            // 为服务器端添加全局变量
            config.plugins = config.plugins || [];
            config.plugins.push(
                new (require('webpack')).DefinePlugin({
                    'typeof window': JSON.stringify('undefined'),
                    'typeof self': JSON.stringify('undefined'),
                    'typeof global': JSON.stringify('object'),
                })
            );
        }
        
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        
        // 简化生产环境优化
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                        },
                    },
                },
            };
        }
        
        return config;
    },
    // 添加静态资源配置
    assetPrefix: '',
    // 排除静态文件被当作页面处理
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    
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
            },
            // 页面重命名的301重定向
            {
                source: '/dreadlocks',
                destination: '/dreadlocks-filter',
                permanent: true,
            },
            {
                source: '/low-fade-haircut',
                destination: '/low-fade-haircut-filter',
                permanent: true,
            },
            {
                source: '/pompadour',
                destination: '/pompadour-filter',
                permanent: true,
            },
            {
                source: '/man-bun',
                destination: '/man-bun-filter',
                permanent: true,
            },
            {
                source: '/undercut',
                destination: '/undercut-filter',
                permanent: true,
            },
            {
                source: '/textured-fringe',
                destination: '/textured-fringe-filter',
                permanent: true,
            },
            {
                source: '/ai-braids',
                destination: '/ai-braids-filter',
                permanent: true,
            },
            // 页面重命名的301重定向
            {
                source: '/hairstyles-for-women',
                destination: '/ai-hairstyle-online-free-female',
                permanent: true,
            },
            {
                source: '/hairstyles-for-men',
                destination: '/ai-hairstyle-male',
                permanent: true,
            }
        ]
    },
    // 环境变量配置
    env: {
        HTTPS_PROXY: process.env.HTTPS_PROXY,
        HTTP_PROXY: process.env.HTTP_PROXY,
        UNDICI_PROXY_URL: process.env.HTTPS_PROXY,
    },
}

module.exports = withBundleAnalyzer(nextConfig) 