import type { Metadata } from 'next'
import Image from 'next/image'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

// 添加元数据
export const metadata: Metadata = {
    metadataBase: new URL('https://hair-style.ai'),
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
    alternates: {
        canonical: 'https://hair-style.ai/about'
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
            name: 'Span Chen',
            jobTitle: 'Founder',
            description: 'With 10 years of experience in AI and computer vision'
        }
    ],
    employees: [
        {
            '@type': 'Person',
            name: 'Jason Chen',
            jobTitle: 'Tech & Writer',
            description: 'Expert in deep learning and image processing'
        },
        {
            '@type': 'Person',
            name: 'Taylor Lei',
            jobTitle: 'Marketing',
            description: 'Marketing Lead at Hair-style.ai, link to more people with beautiful hair pursuits'
        }
    ]
}

export default function About() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="flex-grow">
                <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-white">
                    {/* Hero Section */}
                    <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto text-center mb-20">
                            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">
                                About Hair-style.ai
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                            Hair-style.ai offers a powerful AI-driven hairstyle transformation tool, 
                            providing realistic, easy-to-use, and free virtual hairstyle try-ons for everyone.
                        </p>
                    </div>

                    {/* What We're All About Section */}
                    <div className="max-w-4xl mx-auto mb-20">
                            <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-10">
                                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">
                                    What We're All About
                                </h2>
                                <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                                    <p>
                                        Have you ever looked in the mirror and thought about trying a new hairstyle but felt unsure? We know how that feels. It can be stressful not knowing if a new haircut will look good, worrying about wasting time and money, or feeling nervous about making a big change. These concerns led us to create Hair-style.ai.
                            </p>
                                    <p>
                                        Welcome to Hair-style.ai, where we use advanced AI technology to help you explore and try out different hairstyles in a simple and fun way. Whether you want a bold new look for a special event, a fresh style for a job interview, or just want to see how different hairstyles suit you, our platform lets you test them safely before making a decision.
                                    </p>
                                </div>
                        </div>
                    </div>

                    {/* Meet the Team Section */}
                    <div className="max-w-6xl mx-auto mb-20">
                            <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">
                                Meet the Hair-style.ai Team
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    {
                                        name: 'Span Chen',
                                        title: 'Founder',
                                        image: '/team/Span Chen.jpeg',
                                        description: 'With 10 years of experience in product management and marketing, I\'ve created Hair-style.ai to revolutionize Helping people explore better hairstyles and find the best version of themselves.',
                                        alt: 'Professional headshot of Span Chen, Founder of Hair-style.ai, against a modern office background,Helping people explore better hairstyles and find the best version of themselves.'
                                    },
                                    {
                                        name: 'Jason Chen',
                                        title: 'Tech & Writer',
                                        image: '/team/Jason Chen.jpeg',
                                        description: 'As the Tech & Writer for Hair-style.ai, I\'m passionate about creating a user-friendly and innovative experience. I focus on simplifying the technology behind AI hairstyle changes, making it accessible and fun,for everyone.',
                                        alt: 'Professional portrait of Jason Chen, Tech Lead at Hair-style.ai, in a modern tech workspace'
                                    },
                                    {
                                        name: 'Taylor Lei',
                                        title: 'Marketing',
                                        image: '/team/Taylor Lei.jpeg',
                                        description: 'As the Marketing for Hair-style.ai, Taylor Lei is passionate about crafting a delightful and user-friendly experience for individuals looking to explore new hairstyles. Makes it easy for users to experiment with different looks, fostering creativity and self-expression.',
                                        alt: 'Professional headshot of Taylor Lei, Marketing Lead at Hair-style.ai, link to more people with beautiful hair pursuits'
                                    }
                                ].map((member, index) => (
                                    <div key={index} className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8 transform hover:scale-[1.02] transition-all duration-300">
                                        <div className="relative mb-6 rounded-2xl overflow-hidden">
                                            <Image
                                                src={member.image}
                                                alt={member.alt}
                                                width={400}
                                                height={400}
                                                className="aspect-square object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />
                            </div>
                                        <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                                        <p className="text-purple-600 font-medium mb-4">{member.title}</p>
                                        <p className="text-gray-600 leading-relaxed">
                                            {member.description}
                                </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Our Vision & Mission Section */}
                        <div className="max-w-6xl mx-auto mb-20 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Vision Card */}
                                <div className="bg-gradient-to-br from-purple-50 to-white p-10 rounded-3xl shadow-lg border border-purple-100 transform hover:scale-[1.02] transition-transform duration-300">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-purple-700 rounded-2xl">
                                            <svg 
                                                className="w-8 h-8 text-white" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        </div>
                                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">
                                            Our Vision
                                        </h2>
                                    </div>
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                    We envision a world where everyone can confidently explore and visualize their ideal hairstyle 
                                    before making a change. Hair-style.ai aims to eliminate the uncertainty and anxiety often 
                                    associated with trying new hairstyles, empowering people to make confident style decisions.
                                </p>
                            </div>

                                {/* Mission Card */}
                                <div className="bg-gradient-to-br from-purple-50 to-white p-10 rounded-3xl shadow-lg border border-purple-100 transform hover:scale-[1.02] transition-transform duration-300">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-purple-700 rounded-2xl">
                                            <svg 
                                                className="w-8 h-8 text-white" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
                                                />
                                            </svg>
                                        </div>
                                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">
                                            Our Mission
                                        </h2>
                                    </div>
                                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                        Our mission is to provide the most accurate and accessible AI-powered hairstyle visualization tool. 
                                        We strive to:
                                    </p>
                                    <ul className="space-y-4">
                                        {[
                                            'Make hairstyle visualization accessible to everyone',
                                            'Provide realistic and accurate previews',
                                            'Protect user privacy and data security',
                                            'Continuously improve our AI technology'
                                        ].map((item, index) => (
                                            <li key={index} className="flex items-center gap-3 text-gray-600">
                                                <div className="w-2 h-2 bg-purple-700 rounded-full"></div>
                                                <span className="text-lg">{item}</span>
                                            </li>
                                        ))}
                                </ul>
                                </div>
                        </div>
                    </div>

                    {/* Technology Section */}
                        <div className="max-w-6xl mx-auto mb-20 px-4">
                            <div className="mt-16 bg-gradient-to-br from-purple-50 to-white p-10 rounded-3xl shadow-lg border border-purple-100">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-purple-700 rounded-2xl">
                                        <svg 
                                            className="w-8 h-8 text-white" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">
                                        Our Technology
                                    </h2>
                                </div>
                                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                    Hair-style.ai uses advanced AI and deep learning technologies to provide realistic hairstyle transformations. 
                                    Our proprietary algorithms analyze facial features and hair patterns to ensure natural-looking results that 
                                    complement each individual's unique characteristics.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { title: 'Real-time Processing', icon: '⚡' },
                                        { title: 'Advanced AI Analysis', icon: '🧠' },
                                        { title: 'Privacy Protected', icon: '🔒' },
                                        { title: 'High Accuracy', icon: '🎯' }
                                    ].map((feature, index) => (
                                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="text-3xl mb-3">{feature.icon}</div>
                                            <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                                        </div>
                                    ))}
                                </div>
                            </div>
                    </div>

                    {/* Call to Action */}
                        <div className="text-center py-16">
                            <div className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 p-[2px] rounded-2xl">
                        <a 
                            href="/ai-hairstyle" 
                                    className="block bg-white hover:bg-transparent px-8 py-4 rounded-2xl text-lg font-semibold text-purple-700 hover:text-white transition-colors"
                        >
                            Try Hair-style.ai Now
                        </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
} 
