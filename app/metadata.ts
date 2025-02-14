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

// 基础 metadata 配置
const baseMetadata: Metadata = {
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
        title: 'Hair-style.ai | AI Powered Hairstyle Transformation',
        description: 'Transform your look with AI-powered hairstyle visualization. Try different hairstyles instantly!',
        images: ['/twitter-image.jpg'],
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
    description: 'The #1 hair changer app. Change Your Hairstyle With AI. 512,762+ hairstyles already changed. Upload photo. Style. Afro, Bob cut, Bowl cut, Braid, Caesar cut...',
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
        'online hairstyle changer free',
        'hairstyle changer online',
        'free ai hairstyle male',
        'ai hairstyle changer',
        'online hairstyle changer free',
        'test hairstyles on my face',
        'hairstyle ai',
        'hairstyle changer',
        'hairstyle change online',
        'hairstyle change men'
    ]
}

// AI Hairstyle 页面 metadata
export const aiHairstyleMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/ai-hairstyle',
    },
    title: 'AI Hairstyle Changer - Try New Hairstyles',
    description: 'Transform your look with our AI hairstyle changer. Upload your photo and instantly see yourself with different hairstyles.',
    keywords: [
        'ai hairstyle generator',
        'virtual hairstyle try on',
        'hairstyle simulator',
        'hair makeover app',
        'virtual hair color changer',
        'hairstyle preview tool',
        'ai hair transformation',
        'virtual haircut app'
    ],
    openGraph: {
        title: 'AI Hairstyle Changer - Try New Hairstyles',
        description: 'Transform your look instantly with our AI hairstyle changer. Upload your photo and see yourself with different hairstyles.',
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
    description: ' Meet our team and discover how we\'re revolutionizing hairstyle visualization.',
    keywords: 'Hair-style.ai, AI hairstyle, virtual hairstyle, hairstyle transformation, about us',
}

// Privacy Policy 页面 metadata
export const privacyPolicyMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/privacy-policy',
    },
    title: 'Privacy Policy - Hair-style.ai',
    description: 'Read our privacy policy to understand how we protect your data and respect your privacy.',
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
        description: 'Learn how we protect your privacy and secure your data at Hair-style.ai',
        url: 'https://hair-style.ai/privacy-policy',
        siteName: 'Hair-style.ai',
        type: 'website'
    }
}

// Terms & Conditions 页面 metadata
export const termsAndConditionsMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/terms-and-conditions',
    },
    title: 'Terms & Conditions - Hair-style.ai',
    description: 'Read our terms and conditions to understand the rules and guidelines for using Hair-style.ai services.',
    keywords: [
        'terms and conditions',
        'user agreement',
        'service terms',
        'legal terms',
        'usage terms',
        'terms of service',
        'hair-style.ai terms'
    ],
    openGraph: {
        title: 'Terms & Conditions - Hair-style.ai',
        description: 'Understand our terms of service and user guidelines at Hair-style.ai',
        url: 'https://hair-style.ai/terms-and-conditions',
        siteName: 'Hair-style.ai',
        type: 'website'
    }
} 