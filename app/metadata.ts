import { Metadata } from 'next'

// 定义全局默认 metadata
export const defaultMetadata = {
    metadataBase: new URL('https://hair-style.ai'),
    title: {
        default: 'Hair-style.ai | AI Powered Virtual Hairstyle Try-On Tool',
        template: '%s | Hair-style.ai'
    },
    description: 'Try on different hairstyles instantly with our free AI-powered virtual hairstyle tool.',
    keywords: ['AI hairstyle', 'virtual hairstyle', 'hair transformation'],
    authors: [{ name: 'Hair-style.ai Team' }],
    creator: 'Hair-style.ai',
    publisher: 'Hair-style.ai',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
    },
    // 默认的 OpenGraph 配置
    openGraph: {
        type: 'website',
        siteName: 'Hair-style.ai',
        images: [{
            url: 'https://hair-style.ai/images/logo/og-logo.png',
            width: 1200,
            height: 630,
            alt: 'Hair-style.ai Logo',
        }],
    },
}

// 首先定义基础 metadata
export const baseMetadata: Metadata = {
    metadataBase: new URL('https://hair-style.ai'),
    title: 'Hair-style.ai | AI Powered Hairstyle Transformation',
    description: 'Transform your look with AI-powered hairstyle visualization. Try different hairstyles instantly and find your perfect style with Hair-style.ai',
    keywords: 'AI hairstyle, virtual hairstyle, hairstyle transformation, hairstyle preview, AI hair makeover, virtual hair try-on',
    openGraph: {
        title: 'Hair-style.ai | Try Different Hairstyles with AI',
        description: 'Transform your look with AI-powered hairstyle visualization. Preview different hairstyles before making a change.',
        url: 'https://hair-style.ai',
        siteName: 'Hair-style.ai',
        images: [
            {
                url: 'https://hair-style.ai/images/logo/og-logo.png',
                width: 1200,
                height: 630,
                alt: 'Hair-style.ai - AI Hairstyle Transformation',
            }
        ],
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        site: '@hair_styleai',
        title: 'Hair-style.ai | AI Powered Hairstyle Transformation',
        description: 'Transform your look with AI-powered hairstyle visualization. Try different hairstyles instantly!',
        images: ['/images/hero/ba3.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'your-google-verification-code',
    }
}

// 首页 metadata
export const homeMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai',
    },
    title: 'Hair-style.ai - AI Hairstyle Changer',
    description: 'Transform your look with our AI hairstyle changer. Try 60+ trendy styles including bob cuts, waves, braids and more.',
    openGraph: {
        title: 'Hair-style.ai - AI Hairstyle Changer',
        description: 'One-click free AI hairstyle change! Choose from over 60 hairstyles, including bob, wavy curls, buzz cut, bald, slicked back, braids, and more.',
        url: 'https://hair-style.ai',
        siteName: 'Hair-style.ai',
        images: [
            {
                url: 'https://hair-style.ai/images/hero/ba3.jpg',
                width: 1200,
                height: 630,
                alt: 'Before and after comparison of AI hairstyle transformation showing dramatic style changes',
                type: 'image/jpeg'
            }
        ],
        type: 'website',
        locale: 'en_US',
    },
    keywords: [
        'ai hairstyle online free',
        'free ai hairstyle male',
        'ai hairstyle changer',
        'hairstyle change online',
    ]
}

// AI Hairstyle 页面 metadata
export const aiHairstyleMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/ai-hairstyle',
    },
    title: 'AI Hairstyle Changer - Try New Hairstyles',
    description: 'Experience instant hairstyle transformations with our AI-powered tool. Upload your photo and explore endless style possibilities. Free, easy to use.',
    keywords: [
        'ai hairstyle generator',
        'hair makeover app',
        'hair color changer',
        'hairstyle preview tool',
    ],
    openGraph: {
        title: 'AI Hairstyle Changer - Try New Hairstyles',
        url: 'https://hair-style.ai/ai-hairstyle',
        siteName: 'Hair-style.ai',
        images: [
            {
                url: 'https://hair-style.ai/images/hero/ba3.jpg',
                width: 1200,
                height: 630,
                alt: 'AI Hairstyle Transformation Preview',
                type: 'image/jpeg'
            }
        ],
        type: 'website',
    }
}

// About Us 页面 metadata
export const aboutUsMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/about',
    },
    title: 'About Hair-style.ai | AI Powered Hairstyle Transformation',
    description: 'Discover how Hair-style.ai is revolutionizing hairstyle visualization with cutting-edge AI technology. Meet our passionate team.',
    keywords: 'Hair-style.ai, AI hairstyle, virtual hairstyle, hairstyle transformation, about us',
}

// Privacy Policy 页面 metadata
export const privacyPolicyMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/privacy-policy',
    },
    title: 'Privacy Policy - Hair-style.ai',
    description: 'Learn how Hair-style.ai protects your privacy and personal data. Our comprehensive privacy policy explains our data collection, usage, security measures, and your rights.',
    keywords: [
        'privacy policy',
        'data protection',
        'user privacy',
        'personal data',
        'data security',
        'privacy terms',
        'hair-style.ai privacy'
    ],
    openGraph: {
        title: 'Privacy Policy - Hair-style.ai',
        url: 'https://hair-style.ai/privacy-policy',
        siteName: 'Hair-style.ai',
        type: 'website',
        images: [
            {
                url: '/images/hero/ba3.jpg',
                width: 1200,
                height: 630,
                alt: 'Hair-style.ai transformation example',
                type: 'image/jpeg',
            }
        ],
    }
}

// Terms & Conditions 页面 metadata
export const termsAndConditionsMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/terms-and-conditions',
    },
    title: 'Terms & Conditions - Hair-style.ai',
    description: 'Read our terms and conditions to understand your rights and responsibilities when using Hair-style.ai. Learn about our service guidelines and user agreements.',
    keywords: [
        'user agreement',
        'service terms',
        'legal terms',
        'usage terms',
        'terms of service',
        'hair-style.ai terms'
    ],
    openGraph: {
        title: 'Terms & Conditions - Hair-style.ai',
        url: 'https://hair-style.ai/terms-and-conditions',
        siteName: 'Hair-style.ai',
        type: 'website',
        images: [
            {
                url: '/images/hero/ba3.jpg',
                width: 1200,
                height: 630,
                alt: 'Hair-style.ai transformation example',
                type: 'image/jpeg',
            }
        ],
    }
} 