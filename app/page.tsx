"use client"

import Header from "@/components/header";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Navbar from '@/components/navbar';
import Image from 'next/image';
import Link from 'next/link';

// JSON-LD 结构化数据


const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Hair-style.ai',
    url: 'https://hair-style.ai',
    description: 'AI-powered hairstyle transformation and visualization tool',
    applicationCategory: 'Beauty & Lifestyle',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
    },
    features: [
        'Real-time hairstyle visualization',
        'Multiple hairstyle options',
        'AI-powered transformation',
        'Free to use',
        'Instant preview'
    ],
    screenshot: '/app-screenshot.jpg',
    provider: {
        '@type': 'Organization',
        name: 'Hair-style.ai',
        url: 'https://hair-style.ai'
    }
}

export default function Home() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="bg-gradient-to-b from-purple-50 to-white">
                <div className="container mx-auto px-4 py-8 md:py-16">
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="w-full md:w-1/2 text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-bold mb-6">
                                Transform Your Look with AI
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-8">
                                Try on different hairstyles instantly with our AI-powered platform
                            </p>
                            <Link
                                href="/ai-hairstyle"
                                className="inline-block bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition-colors"
                            >
                                Try Now
                            </Link>
                        </div>
                        
                        <div className="w-full md:w-1/2">
                            <Image
                                src="/images/hero/demo.png"
                                alt="AI Hairstyle Demo"
                                width={600}
                                height={400}
                                className="rounded-lg shadow-xl"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-white rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Instant Preview</h3>
                        <p className="text-gray-600">See how you'd look with different hairstyles in seconds</p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}



