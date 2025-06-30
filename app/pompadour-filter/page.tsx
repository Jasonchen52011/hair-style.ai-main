
import { Metadata } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'react-before-after-slider-component/dist/build.css'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

import HeroSection from '@/components/HeroSection'
import BeforeAfterSection from '@/components/BeforeAfterSection'
import FaceShapesSection from '@/components/FaceShapesSection'
import HowToMaintainSection from '@/components/HowToMaintainSection'
import HowToUseSection from '@/components/HowToUseSection'
import UsageScenariosSection from '@/components/UsageScenariosSection'
import WhyChooseSection from '@/components/WhyChooseSection'
import MoreFreeAITools from '@/components/MoreFreeAITools'
import FAQ from '@/components/faq'
import CTASection from '@/components/CTASection'
import configData from './config.json'

const config = configData as any;

const { 
  imageConfig, 
  heroSection, 
  beforeAfterGallery, 
  isRightSection, 
  additionalSection,
  regretsSection,
  howToUseSection, 
  ctaSections, 
  whyChooseSection, 
  testimonialsConfig, 
  faqConfig, 
  moreToolsSection,
  finalCta, 
  structuredData, 
  breadcrumbData,
  seoConfig
} = config;

// ## Pompadour Page metadata
export const metadata: Metadata = {
    title: seoConfig.title,
    description: seoConfig.description,
    alternates: {
        canonical: seoConfig.canonical
    },
    robots: {
        index: seoConfig.robots.index,
        follow: seoConfig.robots.follow,
        googleBot: {
            index: seoConfig.robots.googleBot.index,
            follow: seoConfig.robots.googleBot.follow,
            'max-video-preview': seoConfig.robots.googleBot['max-video-preview'],
            'max-image-preview': 'large' as const,
            'max-snippet': seoConfig.robots.googleBot['max-snippet'],
        },
    },
    openGraph: {
        title: seoConfig.openGraph.title,
        description: seoConfig.openGraph.description,
        url: seoConfig.openGraph.url,
        siteName: seoConfig.openGraph.siteName,
        locale: seoConfig.openGraph.locale,
        type: 'website',
        images: [
            {
                url: seoConfig.openGraph.images[0].url,
                width: seoConfig.openGraph.images[0].width,
                height: seoConfig.openGraph.images[0].height,
                alt: seoConfig.openGraph.images[0].alt,
                type: seoConfig.openGraph.images[0].type as 'image/webp'
            }
        ]
    },
    twitter: {
        card: seoConfig.twitter.card as 'summary_large_image',
        site: seoConfig.twitter.site,
        title: seoConfig.twitter.title,
        description: seoConfig.twitter.description,
        images: seoConfig.twitter.images
    },
}

export default function PompadourPage() {
    return (
        <>        
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    ...structuredData,
                    metadataBase: new URL(structuredData.metadataBase)
                }) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                
                <HeroSection 
                    heroSection={heroSection}
                    imageConfig={imageConfig}
                />

                
                    <BeforeAfterSection beforeAfterGallery={beforeAfterGallery} />
                

                
                    <FaceShapesSection isRightSection={isRightSection} />
                

                
                    <HowToMaintainSection additionalSection={additionalSection} />
                

                
                    <HowToUseSection howToUseSection={howToUseSection} />
                


                <UsageScenariosSection ctaSections={ctaSections} />

                
                    <WhyChooseSection 
                        whyChooseSection={whyChooseSection}
                        testimonialsConfig={testimonialsConfig}
                    />
                

                
                    <MoreFreeAITools moreToolsSection={moreToolsSection} />
                

                
                    <FAQ faqs={faqConfig} />
                

                <CTASection finalCta={finalCta} />

                <Footer />
            </div>
        </>
    )
}