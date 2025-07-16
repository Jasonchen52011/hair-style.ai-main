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
import HairRegretsSection from '@/components/HairRegretsSection'
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
  finalCta, 
  structuredData, 
  breadcrumbData,
  seoConfig
} = config;

// #men hairstyles page metadata
export const metadata: Metadata = {
    title: seoConfig.title,
    description: seoConfig.description,
    alternates: {
        canonical: seoConfig.canonical
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

export default function MenHairstylesPage() {
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
                
                {/* Hero Section */}
                <HeroSection 
                    heroSection={heroSection}
                    imageConfig={imageConfig}
                />

                {/* Before & After Gallery */}
                <BeforeAfterSection beforeAfterGallery={beforeAfterGallery} />

                {/* Face Shapes Section */}
                <FaceShapesSection isRightSection={isRightSection} />

                {/* How to Maintain Section */}
                <HowToMaintainSection additionalSection={additionalSection} />

                {/* Hair Regrets Section */}
                <HairRegretsSection regretsSection={regretsSection} />

                {/* How to Use Section */}
                <HowToUseSection howToUseSection={howToUseSection} />

                {/* Usage Scenarios Sections */}
                <UsageScenariosSection ctaSections={ctaSections} />

                {/* Why Choose Section */}
                <WhyChooseSection 
                    whyChooseSection={whyChooseSection}
                    testimonialsConfig={testimonialsConfig}
                />

                {/* More Free AI Tools Section */}
                <MoreFreeAITools moreToolsSection={config.moreToolsSection} />

                {/* FAQ Section */}
                <FAQ faqs={faqConfig} />

                {/* CTA Section */}
                <CTASection finalCta={finalCta} />

                <Footer />
            </div>
        </>
    )
}
