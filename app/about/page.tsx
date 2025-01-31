import type { Metadata } from 'next'
import Image from 'next/image'

// 添加元数据
export const metadata: Metadata = {
    title: 'About Hair-style.ai | AI Powered Hairstyle Transformation',
    description: 'Learn about Hair-style.ai, the leading AI-powered platform for virtual hairstyle try-ons. Meet our team and discover how we\'re revolutionizing hairstyle visualization.',
    keywords: 'Hair-style.ai, AI hairstyle, virtual hairstyle, hairstyle transformation, about us, hairstyle technology',
    openGraph: {
        title: 'About Hair-style.ai | AI Powered Hairstyle Transformation',
        description: 'Discover how Hair-style.ai is revolutionizing hairstyle visualization with AI technology. Try different hairstyles risk-free before making a change.',
        url: 'https://hair-style.ai/about',
        siteName: 'Hair-style.ai',
        images: [
            {
                url: '/og-image.jpg', // 需要添加实际的 Open Graph 图片
                width: 1200,
                height: 630,
                alt: 'Hair-style.ai Team and Technology',
            }
        ],
        type: 'website',
    },
}

// 添加 JSON-LD 结构化数据
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hair-style.ai',
    url: 'https://hair-style.ai',
    logo: 'https://hair-style.ai/logo.png', // 需要添加实际的 logo URL
    description: 'AI-powered platform for virtual hairstyle transformation and visualization.',
    foundingDate: '2024',
    address: {
        '@type': 'PostalAddress',
        addressCountry: 'US'
    },
    sameAs: [
        'https://twitter.com/hairstyleai',
        'https://facebook.com/hairstyleai',
        // 添加其他社交媒体链接
    ],
    founders: [
        {
            '@type': 'Person',
            name: 'David Chen',
            jobTitle: 'Founder & CEO',
            description: 'With 10 years of experience in AI and computer vision'
        }
    ],
    employees: [
        {
            '@type': 'Person',
            name: 'Sarah Zhang',
            jobTitle: 'Tech Lead',
            description: 'Expert in deep learning and image processing'
        },
        {
            '@type': 'Person',
            name: 'Michael Lee',
            jobTitle: 'Design Lead',
            description: 'Specialist in UX design and user experience'
        }
    ]
}

export default function About() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-8">About Hair-style.ai</h1>
                
                <div className="prose prose-lg max-w-none">
                    <p className="text-lg text-gray-600 mb-6">
                        Hair-style.ai is an innovative platform that uses advanced AI technology
                        to help you visualize different hairstyles before making a change.
                    </p>
                    
                    <h2 className="text-2xl md:text-3xl font-semibold mt-12 mb-6">Our Mission</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        We aim to revolutionize the way people choose their hairstyles by providing
                        instant, realistic previews of different looks.
                    </p>
                    
                    {/* Add more sections... */}
                </div>
            </div>
        </div>
    );
} 
