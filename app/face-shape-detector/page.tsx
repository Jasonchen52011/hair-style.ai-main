import { Metadata } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'

import HowToUseSection from '@/components/HowToUseSection'
import UsageScenariosSection from '@/components/UsageScenariosSection'
import WhyChooseSection from '@/components/WhyChooseSection'
import FAQ from '@/components/faq'
import CTASection from '@/components/CTASection'
import MoreFreeAITools from '@/components/MoreFreeAITools'
import configData from './config.json'
import ToolPage from './tool-page';

const config = configData as any;

const { 
  heroSection, 
  howToUseSection, 
  ctaSections, 
  whyChooseSection, 
  testimonialsConfig, 
  faqConfig, 
  finalCta,
  moreToolsSection
} = config;

// Face Shape Detector Page metadata
export const metadata: Metadata = {
    title: "AI Face Shape Detector Online Free - Hairstyle AI",
    description: "With our AI-driven face shape detector, get personalized hairstyle suggestions based on your unique facial features. Upload your photo and receive fast, accurate results.",
    alternates: {
        canonical: "https://hair-style.ai/face-shape-detector"
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large' as const,
            'max-snippet': -1,
        },
    },
    openGraph: {
        title: "AI Face Shape Detector Online Free - Hairstyle AI",
        description: "With our AI-driven face shape detector, get personalized hairstyle suggestions based on your unique facial features. Upload your photo and receive fast, accurate results.",
        url: "https://hair-style.ai/face-shape-detector",
        siteName: "Hair-style.ai",
        locale: "en_US",
        type: 'website',
        images: [
            {
                url: "https://hair-style.ai/images/face-shape-hero.webp",
                width: 1920,
                height: 1080,
                alt: "AI Face Shape Detector Online Free - Hairstyle AI",
                type: 'image/webp'
            }
        ]
    },
    twitter: {
        card: 'summary_large_image' as const,
        site: "@hair_styleai",
        title: "AI Face Shape Detector Online Free - Hairstyle AI",
        description: "With our AI-driven face shape detector, get personalized hairstyle suggestions based on your unique facial features. Upload your photo and receive fast, accurate results.",
        images: ["https://hair-style.ai/images/face-shape-hero.webp"]
    }
}

export default function FaceShapeDetectorPage() {
    return (
        <>        
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                
                {/* Face Shape Detector Tool */}
                <ToolPage />

                {/* How to Use Section */}
                <HowToUseSection howToUseSection={howToUseSection} />

                {/* Usage Scenarios */}
                <UsageScenariosSection ctaSections={ctaSections} />

                {/* Why Choose Us + Testimonials */}
                <WhyChooseSection 
                    whyChooseSection={whyChooseSection}
                    testimonialsConfig={testimonialsConfig}
                />

                {/* FAQ Section */}
                <FAQ faqs={faqConfig} />

                {/* More Free AI Tools */}
                <MoreFreeAITools moreToolsSection={moreToolsSection} />

                {/* Final CTA */}
                <CTASection finalCta={finalCta} />

                <Footer />
            </div>
        </>
    )
}