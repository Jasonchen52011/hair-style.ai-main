import { Metadata } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'react-before-after-slider-component/dist/build.css'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import LazySection from '@/components/LazySection'
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
import TestimonialsSection from '@/components/testimonials'

const config = configData as any;

const { 
  imageConfig, 
  heroSection, 
  beforeAfterGallery, 
  isRightSection, 
  additionalSection,
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

// ## Undercut Page metadata
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
    other: {
        'application-name': structuredData.name,
    }
}

export default function UndercutPage() {
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

                <LazySection>
                    <BeforeAfterSection beforeAfterGallery={beforeAfterGallery} />
                </LazySection>

                <LazySection>
                    <FaceShapesSection isRightSection={isRightSection} />
                </LazySection>

                <LazySection>
                    <HowToMaintainSection additionalSection={additionalSection} />
                </LazySection>

                <LazySection>
                    <HowToUseSection howToUseSection={howToUseSection} />
                </LazySection>


                <UsageScenariosSection ctaSections={ctaSections} />

                <LazySection>
                    <WhyChooseSection 
                        whyChooseSection={whyChooseSection}
                        testimonialsConfig={testimonialsConfig}
                    />
                </LazySection>

    

                <LazySection>
                    <MoreFreeAITools moreToolsSection={moreToolsSection} />
                </LazySection>

                <LazySection>
                    <FAQ faqs={faqConfig} />
                </LazySection>

                <CTASection finalCta={finalCta} />

                <Footer />
            </div>
        </>
    )
}