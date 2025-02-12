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
    description: 'Try different hairstyles instantly with AI. Change your look virtually before making a real change.',
}

// AI Hairstyle 页面 metadata
export const aiHairstyleMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/ai-hairstyle',
    },
    title: 'AI Hairstyle Changer - Try New Hairstyles',
    description: 'Transform your look with our AI hairstyle changer. Upload your photo and instantly see yourself with different hairstyles.',
}

// About Us 页面 metadata
export const aboutUsMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/about',
    },
    title: 'About Us - Hair-style.ai',
    description: 'Learn more about Hair-style.ai and our mission to help people visualize their perfect hairstyle.',
}

// Privacy Policy 页面 metadata
export const privacyPolicyMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/privacy-policy',
    },
    title: 'Privacy Policy - Hair-style.ai',
    description: 'Read our privacy policy to understand how we protect your data and respect your privacy.',
}

// Terms & Conditions 页面 metadata
export const termsAndConditionsMetadata: Metadata = {
    ...baseMetadata,
    alternates: {
        canonical: 'https://hair-style.ai/terms-and-conditions',
    },
    title: 'Terms & Conditions - Hair-style.ai',
    description: 'Read our terms and conditions to understand the rules and guidelines for using Hair-style.ai services.',
} 