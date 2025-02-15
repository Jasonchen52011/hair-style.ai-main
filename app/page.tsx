import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Navbar from '@/components/navbar';
import Image from 'next/image'; 
import { homeMetadata } from './metadata'

// JSON-LD 结构化数据


const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
    },
    aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '25318',
        bestRating: '5',
        worstRating: '3'
    },
    description: 'One-click free AI hairstyle change! Choose from over 60 hairstyles, including bob, wavy curls, buzz cut, bald, slicked back, braids, and more.',
    downloadUrl: 'https://hair-style.ai/ai-hairstyle',
    featureList: [
        'Over 60+ hairstyle options',
        'One-click AI transformation',
        'Instant preview',
        'Free to use',
        'No download required',
        'Works on all devices'
    ],
    screenshot: [
        {
            '@type': 'ImageObject',
            url: 'https://hair-style.ai/images/hero/ba3.jpg',
            caption: 'AI Hairstyle Transformation Example'
        }
    ],
    softwareVersion: '1.0',
    fileSize: '0',
    interactionCount: '2.91M',
    datePublished: '2024-01-01',
    applicationSubCategory: 'Design/Graphics',
    provider: {
        '@type': 'Organization',
        name: 'Hair-style.ai',
        url: 'https://hair-style.ai'
    }
}

export const metadata = homeMetadata

export default function Home() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Hero />
            <Footer />
        </div>
    );
}



