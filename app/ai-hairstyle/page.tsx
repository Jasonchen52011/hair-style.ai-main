import { Metadata } from "next";
import PageContent from "./page-content";


const structuredData = {
    metadataBase: new URL('https://hair-style.ai'),
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI Hairstyle Changer',
    description:
      "Experience instant hairstyle transformations with our AI-powered tool. Upload your photo and explore endless style possibilities. Free, easy to use.",
    applicationCategory: 'WebApplication',
    operatingSystem: 'Windows, MacOS, Linux, ChromeOS, Android, iOS, iPadOS',
    brand: {
      '@type': 'Brand',
      name: 'AI Hairstyle Changer'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      ratingCount: '2615'
    }
  }


// AI Hairstyle 页面 metadata
export const metadata: Metadata = {
    title: "AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles",
    description: "Experience instant hairstyle transformations with our AI-powered tool. Upload your photo and explore endless style possibilities. Free, easy to use.",
    alternates: {
        canonical: 'https://hair-style.ai/ai-hairstyle'
    },
    robots: {
        follow: false,
        index: true
    },
    openGraph: {
        title: "AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles",
        description: "Experience instant hairstyle transformations with our AI-powered tool. Upload your photo and explore endless style possibilities. Free, easy to use.",
        images: [
            {
                url: "https://hair-style.ai/images/hero/ba3.jpg",
                width: 1920,
                height: 1080,
                alt: "AI Hairstyle Transformation Preview",
                type: "image/jpeg"
            }
        ],
        siteName: "Hair-style.ai",
        locale: "en_US",
        type: "website",
        url: "https://hair-style.ai/ai-hairstyle",
    },
    twitter: {
        card: "summary_large_image",
        site: "@hair_styleai",
        title: "AI Hairstyle Changer - Try New Hairstyles",
        description: "Experience instant hairstyle transformations with our AI-powered tool. Upload your photo and explore endless style possibilities. Free, easy to use.",
        images: ["https://hair-style.ai/images/hero/ba3.jpg"]
    },

}


export default function Home() {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PageContent />
      </>
    )
  }
  