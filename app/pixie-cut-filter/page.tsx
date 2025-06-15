import { Metadata } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'react-before-after-slider-component/dist/build.css'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Testimonials from '@/components/testimonials'
import FAQ from '@/components/faq'
import LazySection from '@/components/LazySection'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import Image from 'next/image'
import Link from 'next/link'
import config from './config.json'


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
  finalCta, 
  structuredData, 
  breadcrumbData,
  seoConfig
} = config;

const before = imageConfig.beforeImage;
const after = imageConfig.afterImage;
const IMAGE_DISPLAY_HEIGHT = imageConfig.displayHeight;



// AI Pixie Cut Filter 页面 metadata
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

export default function PixieCutFilterPage() {
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
                <section className="bg-white py-2 sm:py-10  mb-10 mt-2 sm:mt-6">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-center ">
                            {/* 左侧内容 */}
                            <div className="pr-8 order-2 lg:order-1">
                                <h1 className="text-2xl sm:text-5xl font-bold mb-6 text-gray-900">
                                    {heroSection.title}
                                </h1>
                                <p className="text-lg md:text-xl text-gray-800 mb-4 sm:mb-2 ">
                                    {heroSection.description}
                                </p>
                                
                                {/* 统计数据 */}
                                <div className="flex items-center gap-3 mb-8 mt-16">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const rating = heroSection.rating;
                                            if (star <= Math.floor(rating)) {
                                                // 完全填充的星星
                                                return (
                                                    <i 
                                                        key={star}
                                                        className="fas fa-star text-yellow-400 text-sm"
                                                    />
                                                );
                                            } else if (star <= rating) {
                                                // 半填充的星星
                                                return (
                                                    <i 
                                                        key={star}
                                                        className="fas fa-star-half text-yellow-400 text-sm"
                                                    />
                                                );
                                            } else {
                                                // 空星星
                                                return (
                                                    <i 
                                                        key={star}
                                                        className="fas fa-star text-gray-300 text-sm"
                                                    />
                                                );
                                            }
                                        })}
                                    </div>
                                    <span className="text-gray-600 font-medium text-sm sm:text-base">{heroSection.statsText}</span>
                                </div>
                                
                                <Link 
                                    href={heroSection.ctaLink}
                                    className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                >
                                    {heroSection.ctaText}
                                    <i className="fas fa-arrow-right  "></i>
                                </Link>
                            </div>
                            
                            {/* 右侧对比图片 */}
                            <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                                <BeforeAfterSlider
                                    beforeImage={before}
                                    afterImage={after}
                                    beforeAlt="Before pixie cut - original hairstyle"
                                    afterAlt="After pixie cut - transformed short hairstyle"
                                    height={IMAGE_DISPLAY_HEIGHT}
                                />
                            </div>
                        </div>
                    </div>
                </section>



                {/* Before & After Gallery */}
                    <section className="py-2 sm:py-20 bg-gray-50">
                        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                            <div className="text-center mb-16">
                                <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
                                    {beforeAfterGallery.title}
                                </h2>
                                <p className="text-lg text-gray-800 max-w-5xl mx-auto">
                                    {beforeAfterGallery.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                {beforeAfterGallery.images.map((image, index) => (
                                    <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                                        <Image
                                            src={image.src}
                                            alt={image.alt}
                                            width={400}
                                            height={300}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
         



                {/* Is Pixie Cut Right for Me? Section */}
                <LazySection>
                <section className="py-10 sm:py-20 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <h2 className="text-2xl sm:text-4xl font-bold mb-12 text-center text-gray-800">
                            {isRightSection.title}
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* 左侧表格 */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-6 py-4 grid grid-cols-2 gap-4">
                                    <div className="font-semibold text-gray-800">Feature</div>
                                    <div className="font-semibold text-gray-800">Description</div>
                                </div>
                                
                                {isRightSection.tableData.map((row, index) => (
                                    <div key={index} className={`px-6 py-4 ${index !== isRightSection.tableData.length - 1 ? 'border-b border-gray-100' : ''} grid grid-cols-2 gap-4`}>
                                        <div className="font-medium text-gray-800">{row.feature}</div>
                                        <div className="text-gray-800 text-sm sm:text-lg">
                                            {row.feature === "Popularity in 2025" ? (
                                                <div className="flex items-center">
                                                    <span className="text-yellow-400">★★★★★</span>
                                                    <span className="ml-2">{row.description}</span>
                                                </div>
                                            ) : (
                                                row.description
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* 右侧文本 */}
                            <div className="space-y-4 text-gray-800 text-sm sm:text-lg leading-relaxed">
                                {isRightSection.textContent.map((paragraph, index) => (
                                    <p key={index}>
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                </LazySection>

                {/* Additional Information Sections */}
                {additionalSection.map((section, index) => (
                    <LazySection key={index}>
                        <section className={`py-10 sm:py-20 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                    {/* 图片 */}
                                    <div className={`flex justify-center ${index % 2 === 0 ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}>
                                        <div className="w-full max-w-3xl rounded-lg">
                                            <Image
                                                src={section.image.src}
                                                alt={section.image.alt}
                                                width={800}
                                                height={600}
                                                className="w-full h-auto object-contain rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* 文本内容 */}
                                    <div className={`space-y-6 ${index % 2 === 0 ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                            {section.title}
                                        </h2>
                                        <div className="space-y-4">
                                            {section.textContent.map((paragraph, pIndex) => (
                                                <p key={pIndex} className="text-gray-800 text-sm sm:text-lg leading-relaxed">
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                        
                                        <Link 
                                            href={section.ctaLink}
                                            className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                        >
                                            {section.ctaText}
                                            <i className="fas fa-arrow-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </LazySection>
                ))}

                {/* How to Try Pixie Cut with Hairstyle AI Section */}
                <LazySection>
                <section className="py-10 sm:py-20 bg-gray-50">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 ">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
                                {howToUseSection.title}
                            </h2>
                            <p className=" text-gray-800 text-sm sm:text-lg max-w-5xl mx-auto">
                                {howToUseSection.description}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ">
                            {/* 左侧步骤 */}
                            <div className="space-y-6 order-2 lg:order-1">
                                {howToUseSection.steps.map((step, index) => (
                                    <div key={index}>
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">
                                            <i className={`${step.icon} mr-2 text-purple-600`}></i>
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-800 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                ))}
                                
                                <Link 
                                    href={howToUseSection.ctaLink}
                                    className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                >
                                    {howToUseSection.ctaText}
                                    <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                            
                            {/* 右侧占位图 */}
                            <div className="flex justify-center order-1 lg:order-2">
                                <div className="w-full max-w-3xl bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                                    <Image
                                        src={howToUseSection.image.src}
                                        alt={howToUseSection.image.alt}
                                        width={800}
                                        height={900}
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                </LazySection>

                {/* Not Sure If a Pixie Cut Suits Your Face Shape? Try It Online in Seconds Sections */}
                {ctaSections.map((section, index) => (
                    <section key={index} className={`py-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                            <div className="max-w-full mx-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                    {/* 图片 */}
                                    <div className={`flex justify-center ${index % 2 === 0 ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}>
                                        <div className="w-full max-w-3xl rounded-lg ">
                                            <Image
                                                src={section.image.src}
                                                alt={section.image.alt}
                                                width={800}
                                                height={600}
                                                className="w-full h-auto object-contain"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* 文本内容 */}
                                    <div className={`space-y-6 ${index % 2 === 0 ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                            {section.title}
                                        </h2>
                                        <p className=" text-gray-800 text-sm sm:text-lg leading-relaxed">
                                            {section.description}
                                        </p>
                                        
                                        <Link 
                                            href={section.ctaLink}
                                            className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                        >
                                            {section.ctaText}
                                            <i className="fas fa-arrow-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ))}

                {/* Why Choose Our Pixie Cut Filter Section */}
                <LazySection>
                <section className="py-10 mt-10 bg-white">
                    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2 sm:mb-6 text-gray-800">
                                {whyChooseSection.title}
                            </h2>
                        </div>
                        
                        <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                            {whyChooseSection.features.map((feature, index) => (
                                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                                    <i className={`${feature.icon} text-4xl text-purple-600 mb-6`}></i>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 mt-10">
                    <div className="w-full">
                        <Testimonials testimonials={testimonialsConfig} />
                    </div>
                </div>
                    </div>
                </section>
                </LazySection>

                {/* FAQ Section */}
                <LazySection>
                <section className="py-20 bg-white">
                    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
                                Frequently Asked Questions
                            </h2>

                        </div>
                        
                        <FAQ faqs={faqConfig} />
                    </div>
                </section>
                </LazySection>

                {/* CTA Section */}
                <section className="py-2 sm:py-20 bg-gray-50 mb-10">
                    <div className="w-full px-2 sm:px-4 lg:px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                                 {finalCta.title}
                            </h2>
                            <p className="text-xl text-gray-700 mb-8">
                                 {finalCta.description}
                            </p>
                            <Link 
                                href={finalCta.ctaLink}
                                className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                            >
                                {finalCta.ctaText}
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </>
    )
}