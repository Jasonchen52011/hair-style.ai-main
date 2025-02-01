/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://hair-style.ai',
    generateRobotsTxt: true,
    changefreq: 'daily',
    priority: 0.7,
    exclude: ['/api/*', '/404', '/500'],
    // 添加额外的 sitemap 配置
    additionalPaths: async (config) => {
        const result = []
        
        // 添加主要功能页面
        result.push({
            loc: '/ai-hairstyle',
            changefreq: 'daily',
            priority: 1.0,
            lastmod: new Date().toISOString()
        })
        
        // 添加多语言页面
        const languages = ['en', 'zh']
        languages.forEach(lang => {
            result.push({
                loc: `/${lang}/ai-hairstyle`,
                changefreq: 'daily',
                priority: 0.9,
                lastmod: new Date().toISOString(),
                alternateRefs: [
                    {
                        href: `https://hair-style.ai/ai-hairstyle`,
                        hreflang: 'x-default'
                    },
                    {
                        href: `https://hair-style.ai/${lang}/ai-hairstyle`,
                        hreflang: lang
                    }
                ]
            })
        })

        // 添加静态页面
        const staticPages = [
            {
                loc: '/about',
                priority: 0.8
            },
            {
                loc: '/privacy-policy',
                priority: 0.6
            },
            {
                loc: '/ai-hairstyle',
                priority: 1.0
            },
        ]
        
        staticPages.forEach(page => {
            result.push({
                ...page,
                changefreq: 'monthly',
                lastmod: new Date().toISOString()
            })
        })

        return result
    },
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/*',
                    '/admin/*',
                    '/404',
                    '/500'
                ]
            }
        ]
    },
    transform: async (config, path) => {
        // 自定义转换逻辑
        return {
            loc: path,
            changefreq: path === '/ai-hairstyle' ? 'daily' : 'weekly',
            priority: path === '/ai-hairstyle' ? 1.0 : 0.7,
            lastmod: new Date().toISOString(),
            alternateRefs: config.alternateRefs ?? []
        }
    }
} 