import { Metadata } from 'next';
import dynamic from 'next/dynamic'
import '@fortawesome/fontawesome-free/css/all.min.css'
import configData from './config.json'
import Script from 'next/script'

const Navbar = dynamic(() => import('@/components/navbar'), { ssr: true })
const Footer = dynamic(() => import('@/components/footer'), { ssr: true })
const HeroSection = dynamic(() => import('@/components/HeroSection'), { ssr: true })
const HowToUseSection = dynamic(() => import('@/components/HowToUseSection'), { ssr: true })
const UsageScenariosSection = dynamic(() => import('@/components/UsageScenariosSection'), { ssr: true })
const WhyChooseSection = dynamic(() => import('@/components/WhyChooseSection'), { ssr: true })
const MoreFreeAITools = dynamic(() => import('@/components/MoreFreeAITools'), { ssr: true })
const FAQ = dynamic(() => import('@/components/faq'), { ssr: true })
const CTASection = dynamic(() => import('@/components/CTASection'), { ssr: true })
const InfoSectionsComponent = dynamic(() => import('@/components/InfoSectionsComponent'), { ssr: true })

const config = configData as any; 

// Export metadata
export const metadata: Metadata = {
    title: config.seo.title,
    description: config.seo.description,
    metadataBase: new URL(config.seo.baseUrl),
    alternates: {
        canonical: config.seo.url
    },
    openGraph: {
        title: config.seo.openGraph.title,
        description: config.seo.openGraph.description,
        url: config.seo.url,
        images: [
            {
                url: config.seo.openGraph.image.url,
                width: config.seo.openGraph.image.width,
                height: config.seo.openGraph.image.height,
                alt: config.seo.openGraph.image.alt
            }
        ],
        locale: config.seo.openGraph.locale,
        type: config.seo.openGraph.type as "website"
    },
    twitter: {
        card: config.seo.twitter.card as "summary_large_image",
        site: config.seo.twitter.site,
        images: [config.seo.twitter.image],
        creator: config.seo.twitter.creator
    },
    robots: config.seo.robots,
    icons: {
        icon: [
            { url: config.seo.icons.favicon.url, type: config.seo.icons.favicon.type, sizes: config.seo.icons.favicon.sizes },
            { url: config.seo.icons.logo.url, type: config.seo.icons.logo.type, sizes: config.seo.icons.logo.sizes }
        ]
    }
};

export default function WhatHaircutPage() {
    return (
        <>
            {/* Structured Data */}
            <Script id="application-structured-data" type="application/ld+json">
                {JSON.stringify(config.structuredData.app)}
            </Script>
            <Script id="breadcrumb-structured-data" type="application/ld+json">
                {JSON.stringify(config.structuredData.breadcrumb)}
            </Script>
            <Script id="faq-structured-data" type="application/ld+json">
                {JSON.stringify(config.structuredData.faq)}
            </Script>

            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />

                {/* Hero Section */}
                <HeroSection 
                    heroSection={config.heroSection} 
                    imageConfig={config.imageConfig}
                />

                {/* Info Sections */}
                <InfoSectionsComponent infoSections={config.infoSections} />

                {/* How to Use Section */}
                <HowToUseSection howToUseSection={config.howToUseSection} />

                {/* Use Cases Section */}
                <UsageScenariosSection ctaSections={config.useCasesSection} />

                {/* Why Choose Section */}
                <WhyChooseSection 
                    whyChooseSection={config.whyChooseSection}
                    testimonialsConfig={config.testimonialsSection}
                />

                {/* More Free AI Tools */}
                <MoreFreeAITools toolNames={[
                    "Hair Type Identifier",
                    "Random Hairstyle Generator",
                    "Man Bun Filter",
                    "Textured Fringe Filter",
                    "Hairstyles for Girls",
                    "Dreadlocks Filter",
                    "Bob Haircut Filter",
                    "Men's Hairstyles",
                    "Buzz Cut Filter",
                    "Short Hair Filter",
                    "AI Hairstyle Male",
                    "AI Hairstyle Online Free Female"
                ]} />

                {/* FAQ Section */}
                <FAQ faqs={config.faqSection.faqs} />

                {/* Final CTA Section */}
                <CTASection finalCta={config.ctaSection} />

                <Footer />
            </div>
        </>
    )
}