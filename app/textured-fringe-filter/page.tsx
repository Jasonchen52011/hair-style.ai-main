
import { Metadata } from 'next';
import Image from 'next/image'
import Link from 'next/link'
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

const config = configData as any;

const { 
  imageConfig, 
  heroSection,
  heroSectionStyleConfig, 
  beforeAfterGallery, 
  isRightSection, 
  additionalSection,
  regretsSection,
  howToUseSection, 
  ctaSections,
  ctaSectionsStyleConfig, 
  whyChooseSection, 
  testimonialsConfig, 
  faqConfig, 
  moreToolsSection,
  finalCta, 
  structuredData, 
  breadcrumbData,
  seoConfig
} = config;

// ## Textured Fringe Page metadata
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

export default function TexturedFringePage() {
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
                

                <section className="bg-white py-2 sm:py-10 mb-10 mt-2 sm:mt-6">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-center">
                            

                            <div className="flex justify-center lg:justify-center order-1 lg:order-2 lg:col-span-1">
                                <div className="relative rounded-lg overflow-hidden" style={{ height: `${imageConfig.displayHeight}px` }}>
                                    <Image
                                        src={imageConfig.image}
                                        alt={imageConfig.alt}
                                        width={900}
                                        height={imageConfig.displayHeight}
                                        className="object-cover rounded-lg w-full h-full"
                                        priority
                                    />
                                </div>
                            </div>
                            
                      
                            <div className="pr-1 order-2 lg:order-1 lg:col-span-1">
                                <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 text-gray-900">
                                    {heroSection.title}
                                </h1>
                                <p className="text-base md:text-lg text-gray-800 mb-4 sm:mb-2">
                                    {heroSection.description}
                                </p>
                                
                                {/* 用户头像和统计文本 */}
                                <div className="flex items-start justify-center lg:justify-start gap-3 mb-8 mt-16">
                                    {/* 随机用户头像 */}
                                    <div className="flex items-center -space-x-2">
                                        {[
                                            '/images/review/review1.webp',
                                            '/images/review/review2.webp', 
                                            '/images/review/review3.webp',
                                            '/images/review/review4.webp'
                                        ].map((image, index) => (
                                            <div key={index} className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                                                <Image
                                                    src={image}
                                                    alt={`User review ${index + 1}`}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* 星星和统计文本的垂直布局 */}
                                    <div className="flex flex-col">
                                        {/* 星星评分 */}
                                        <div className="flex items-center gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const rating = heroSection.rating;
                                                if (star <= Math.floor(rating)) {
                                                    return (
                                                        <i 
                                                            key={star}
                                                            className="fas fa-star text-yellow-400 text-sm"
                                                        />
                                                    );
                                                } else if (star <= rating) {
                                                    return (
                                                        <i 
                                                            key={star}
                                                            className="fas fa-star-half text-yellow-400 text-sm"
                                                        />
                                                    );
                                                } else {
                                                    return (
                                                        <i 
                                                            key={star}
                                                            className="fas fa-star text-gray-300 text-sm"
                                                        />
                                                    );
                                                }
                                            })}
                                        </div>
                                        {/* 统计文本 */}
                                        <span className="text-gray-600 font-medium text-sm sm:text-base">{heroSection.statsText}</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-center lg:justify-start">
                                    <Link 
                                        href={heroSection.ctaLink}
                                        className="btn text-white bg-purple-600 hover:bg-purple-700 btn-lg rounded-xl border-purple-600 gap-2 text-base font-semibold px-6 py-3"
                                    >
                                        {heroSection.ctaText}
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

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


                <UsageScenariosSection 
                    ctaSections={ctaSections} 
                    styleConfig={ctaSectionsStyleConfig}
                />

                <LazySection>
                    <WhyChooseSection 
                        whyChooseSection={whyChooseSection}
                        testimonialsConfig={testimonialsConfig}
                    />
                </LazySection>

                <LazySection>
                    <MoreFreeAITools toolNames={moreToolsSection} />
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