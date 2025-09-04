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
const FAQ = dynamic(() => import('@/components/faq'), { ssr: true })
const CTASection = dynamic(() => import('@/components/CTASection'), { ssr: true })
const InfoSectionsComponent = dynamic(() => import('@/components/InfoSectionsComponent'), { ssr: true })
const ExploreOtherTools = dynamic(() => import('@/components/ExploreOtherTools'), { ssr: true })

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

                {/* Explore Other Tools */}
                <ExploreOtherTools 
                    title="Explore Other Tools"
                    tools={[
                        {
                            title: "Face Shape Detector",
                            description: "AI Face Shape Detector - Find Your Perfect Hairstyle",
                            link: "/face-shape-detector",
                            image: "/images/face-shape-hero.webp"
                        },
                        {
                            title: "Random Hairstyle Generator", 
                            description: "Generate Random Hairstyles with AI",
                            link: "/random-hairstyle-generator",
                            image: "/images/hero/ba1.jpg"
                        },
                        {
                            title: "Hair Type Identifier",
                            description: "Identify Your Hair Type with AI",
                            link: "/hair-type-identifier", 
                            image: "/images/hero/ba3.jpg"
                        },
                        {
                            title: "What Haircut Should I Get",
                            description: "AI-powered haircut recommendations for your face shape",
                            link: "/what-haircut-should-i-get",
                            image: "/images/what-haircut-should-i-get-hero.webp"
                        }
                    ]}
                />

                {/* FAQ Section */}
                <FAQ faqs={config.faqSection.faqs} />

                {/* Final CTA Section */}
                <CTASection finalCta={config.ctaSection} />

                <Footer />
            </div>
        </>
    )
}