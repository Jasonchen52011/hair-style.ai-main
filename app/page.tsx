"use client"

import Header from "@/components/header";
import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Navbar from '@/components/navbar';
import Image from 'next/image';

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
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <Header />
            <meta name="_foundr" content="915c77b16c71933cb4b42c6eec4601b2" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Hero />
            <Footer />
        </div>
    );
}



