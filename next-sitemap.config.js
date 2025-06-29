/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://hair-style.ai',
    generateRobotsTxt: true,
    generateIndexSitemap: false,
    sitemapSize: 50000,
    outDir: 'public',
    changefreq: 'daily',
    priority: 0.7,
    exclude: ['/api/*', '/404', '/500'],
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
        ],
    },
    additionalPaths: async (config) => {
        const result = []
        
        // 添加主要功能页面
        result.push({
            loc: '/ai-hairstyle',
            changefreq: 'daily',
            priority: 1.0,
            lastmod: new Date().toISOString()
        })
        
        // 添加 hairstyle filter 页面
        const hairstylePages = [
            {
                loc: '/short-hair-filter',
                priority: 0.9
            },
            {
                loc: '/buzz-cut-filter',
                priority: 0.9
            },
            {
                loc: '/bob-haircut-filter',
                priority: 0.9
            },
            {
                loc: '/bangs-filter',
                priority: 0.9
            },
            {
                loc: '/ai-braids-filter',
                priority: 0.9
            },
            {
                loc: '/pixie-cut-filter',
                priority: 0.9
            }
        ]

        hairstylePages.forEach(page => {
            result.push({
                ...page,
                changefreq: 'daily',
                lastmod: new Date().toISOString()
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
        ]
        
        staticPages.forEach(page => {
            result.push({
                ...page,
                changefreq: 'monthly',
                lastmod: new Date().toISOString()
            })
        })

        // 添加 Terms & Conditions 页面
        result.push({
            loc: '/terms-and-conditions',
            changefreq: 'monthly',
            priority: 0.6,
            lastmod: new Date().toISOString()
        })

        return result
    },
} 