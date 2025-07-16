import { Metadata } from 'next';
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'react-before-after-slider-component/dist/build.css'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Testimonials from '@/components/testimonials'
import FAQ from '@/components/faq'

import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import MoreFreeAITools from '@/components/MoreFreeAITools'
import Image from 'next/image'
import Link from 'next/link'
import config from './config.json'

const { 
  imageConfig, 
  heroSection, 
  beforeAfterGallery, 
  isBangsRightSection, 
  howToUseSection, 
  ctaSections, 
  whyChooseSection, 
  testimonialsConfig, 
  faqConfig, 
  finalCta, 
  metadata: metadataConfig,
  structuredData, 
  breadcrumbData 
} = config;

const before = imageConfig.beforeImage;
const after = imageConfig.afterImage;
const IMAGE_DISPLAY_HEIGHT = imageConfig.displayHeight;



// Bangs Filter 页面 metadata
export const metadata: Metadata = {
    title: metadataConfig.title,
    description: metadataConfig.description,
    alternates: {
        canonical: metadataConfig.canonical
    },


    openGraph: {
        title: metadataConfig.openGraph.title,
        description: metadataConfig.openGraph.description,
        images: [
            {
                url: metadataConfig.openGraph.image,
                width: 1920,
                height: 1080,
                alt: metadataConfig.openGraph.imageAlt,
                type: "image/jpeg"
            }
        ],
        siteName: "Hair-style.ai",
        locale: "en_US",
        type: "website",
        url: metadataConfig.openGraph.url,
    },
    twitter: {
        card: "summary_large_image",
        site: "@hair_styleai",
        title: metadataConfig.twitter.title,
        description: metadataConfig.twitter.description,
        images: [metadataConfig.twitter.image]
    },

}

export default function BangsFilterPage() {
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
                                <h1 className="text-3xl sm:text-5xl font-bold sm:mb-10 mb-4 text-gray-900">
                                    {heroSection.title}
                                </h1>
                                <p className="text-base md:text-lg text-gray-600 mb-4 sm:mb-8 ">
                                    {heroSection.textcontent}
                                </p>
                                
                                {/* 统计数据 */}
                                {/* 用户头像和统计文本 */}
                                <div className="flex items-start gap-3 mb-8 mt-16">
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
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <i 
                                                    key={star}
                                                    className="fas fa-star text-yellow-400 text-sm"
                                                />
                                            ))}
                                        </div>
                                        {/* 统计文本 */}
                                        <span className="text-gray-600 font-medium text-sm sm:text-base">{heroSection.statsText}</span>
                                    </div>
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
                                    beforeAlt="Before bangs - original hairstyle"
                                    afterAlt="After bangs - transformed hairstyle with bangs"
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
                                    {beforeAfterGallery.textcontent}
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
                                            unoptimized={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                

                {/* Do Bangs Suit Your Face? Section */}
                
                <section className="py-10 sm:py-16 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <h2 className="text-2xl sm:text-4xl font-bold mb-12 text-center text-gray-800">
                            {isBangsRightSection.title}
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 items-start">
                            {/* 左侧表格 */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden lg:col-span-3">
                                <div className="bg-gray-100 px-6 py-4 grid grid-cols-2 gap-4">
                                    <div className="font-semibold text-gray-800">Feature</div>
                                    <div className="font-semibold text-gray-800">Description</div>
                                </div>
                                
                                {isBangsRightSection.tableData.map((row, index) => (
                                    <div key={index} className={`px-6 py-4 ${index !== isBangsRightSection.tableData.length - 1 ? 'border-b border-gray-100' : ''} grid grid-cols-2 gap-4`}>
                                        <div className="font-medium text-sm sm:text-lg text-gray-800">{row.feature}</div>
                                        <div className="text-gray-800">
                                            {row.feature === "Popularity in 2025" ? (
                                                <div className="flex items-center">
                                                    <span className="text-yellow-400">★★★★★</span>
                                                    <span className="ml-2">{row.textcontent}</span>
                                                </div>
                                            ) : (
                                                row.textcontent
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* 右侧文本 */}
                            <div className="space-y-6 text-gray-800 text-sm sm:text-lg leading-normal lg:col-span-3">   
                                {isBangsRightSection.textContent.map((paragraph, index) => (
                                    <p 
                                        key={index}
                                        dangerouslySetInnerHTML={{ __html: paragraph }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                

                {/* How to Keep Your Bangs Section */}
                <section className="py-2 sm:py-20 bg-white">
                    <div className="w-full px-2 sm:px-4 lg:px-6">
                        <div className="max-w-6xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                                {/* 左侧文本内容 */}
                                <div className="space-y-3 order-2 lg:order-1 lg:col-span-2">
                                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-800">
                                        {ctaSections[3].title}
                                    </h2>
                                    <div className="space-y-4 text-gray-800 text-sm sm:text-lg leading-normal">
                                        {ctaSections[3].textcontent.map((paragraph, index) => (
                                            <p 
                                                key={index}
                                                dangerouslySetInnerHTML={{ __html: paragraph }}
                                            />
                                        ))}
                                    </div>
                                    
                                    <Link 
                                        href={ctaSections[3].ctaLink}
                                        className="btn text-white bg-purple-600 btn-lg mt-4 rounded-xl border-purple-600 gap-2"
                                    >
                                        {ctaSections[3].ctaText}
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                                
                                {/* 右侧占位图 */}
                                <div className="flex justify-center order-1 lg:order-2 lg:col-span-2">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-lg">
                                        <Image
                                            src={ctaSections[3].image.src}
                                            alt={ctaSections[3].image.alt}
                                            width={800}
                                            height={600}
                                            className="w-full h-auto object-contain"
                                            unoptimized={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Regret Your New Bangs? Easy Fixes for You Section */}
                <section className="py-20 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="max-w-full mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                                {/* 左侧占位图 */}
                                <div className="flex justify-center lg:col-span-2">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden">
                                        <Image
                                            src={ctaSections[4].image.src}
                                            alt={ctaSections[4].image.alt}
                                            width={800}
                                            height={600}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                                
                                {/* 右侧文本内容 */}
                                <div className="space-y-3 lg:col-span-2">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                        {ctaSections[4].title}
                                    </h2>
                                    <div className="space-y-4 text-gray-800 text-sm sm:text-lg leading-normal">
                                        {ctaSections[4].textcontent.map((paragraph, index) => (
                                            <p 
                                                key={index}
                                                dangerouslySetInnerHTML={{ __html: paragraph }}
                                            />
                                        ))}
                                    </div>
                                    
                                    <Link 
                                        href={ctaSections[4].ctaLink}
                                        className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                    >
                                        {ctaSections[4].ctaText}
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How to Use the Hairstyle AI Bang Filter Section */}
                
                <section className="py-10 sm:py-20 bg-gray-50">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 ">
                     <div className="text-center mb-12">
                      <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
                      {howToUseSection.title}
                      </h2>
                      <p className="text-base text-gray-800 max-w-5xl mx-auto">
                      {howToUseSection.textcontent}
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
                                        <p className="text-gray-800 text-sm sm:text-base leading-normal">
                                            {step.textcontent}
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
                
           

                {/* Thinking of Getting Bangs? Section */}
                <section className="py-20 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="max-w-full mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                                {/* 左侧占位图 */}
                                <div className="flex justify-center lg:col-span-2">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden">
                                        <Image
                                            src={ctaSections[0].image.src}
                                            alt={ctaSections[0].image.alt}
                                            width={800}  
                                            height={600}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                                
                                {/* 右侧文本内容 */}
                                <div className="space-y-6 lg:col-span-2">
                                <h2 className="text-2xl sm:text-4xl font-bold text-gray-800">
                                    {ctaSections[0].title}    
                                    </h2>
                                    <div className="space-y-4  text-gray-800 text-sm sm:text-lg leading-normal">
                                        {ctaSections[0].textcontent.map((paragraph, index) => (
                                            <p 
                                                key={index}
                                                dangerouslySetInnerHTML={{ __html: paragraph }}
                                            />
                                        ))}
                                    </div>
                                    
                                    <Link 
                                        href={ctaSections[0].ctaLink}
                                        className="btn text-white bg-purple-600 btn-lg mt-4 rounded-xl border-purple-600 gap-2"
                                    >
                                        {ctaSections[0].ctaText}
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Planning a Fun Social Media Post Social Media Section */}
                <section className="py-2 sm:py-20 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="max-w-full mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                                {/* 左侧文本内容 */}
                                <div className="space-y-3 order-2 lg:order-1 lg:col-span-2">
                                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-800">
                                        {ctaSections[1].title}
                                    </h2>
                                    <div className="space-y-4 text-gray-800 text-sm sm:text-lg leading-normal">
                                        {ctaSections[1].textcontent.map((paragraph, index) => (
                                            <p 
                                                key={index}
                                                dangerouslySetInnerHTML={{ __html: paragraph }}
                                            />
                                        ))}
                                    </div>
                                    
                                    <Link 
                                        href={ctaSections[1].ctaLink}
                                        className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                    >
                                        {ctaSections[1].ctaText}
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                                
                                {/* 右侧占位图 */}
                                <div className="flex justify-center order-1 lg:order-2 lg:col-span-2">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden">
                                        <Image
                                            src={ctaSections[1].image.src}
                                            alt={ctaSections[1].image.alt}
                                            width={800}
                                            height={600}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/*Special Events and Parties Section */}
                <section className="py-20 bg-white hidden">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="max-w-full mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 items-center">
                                {/* 左侧占位图 */}
                                <div className="flex justify-center lg:col-span-3">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden">
                                        <Image
                                            src={ctaSections[2].image.src}
                                            alt={ctaSections[2].image.alt}
                                            width={800}
                                            height={600}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                                
                                {/* 右侧文本内容 */}
                                <div className="space-y-6 lg:col-span-3">
                                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-800">
                                            {ctaSections[2].title}
                                    </h2>
                                    <div className="space-y-4 text-gray-800 text-sm sm:text-lg leading-normal">
                                        {ctaSections[2].textcontent.map((paragraph, index) => (
                                            <p 
                                                key={index}
                                                dangerouslySetInnerHTML={{ __html: paragraph }}
                                            />
                                        ))}
                                    </div>
                                    
                                    <Link 
                                        href={ctaSections[2].ctaLink}
                                        className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                    >
                                        {ctaSections[2].ctaText}
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* More Free AI Tools Section */}
                
                    <MoreFreeAITools moreToolsSection={config.moreToolsSection} />
                


                {/* Why Choose Section */}
                
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
                                    <p className="text-gray-600 text-sm sm:text-base leading-normal">
                                        {feature.textcontent}
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
                

                {/* FAQ Section */}
                
                <section className="py-2 bg-white mb-10">
                    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6">
                        <FAQ faqs={faqConfig} />
                    </div>
                </section>
                

                {/* CTA Section */}
                <section className="py-2 sm:py-20 bg-gray-50">
                    <div className="w-full px-2 sm:px-4 lg:px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                                 {finalCta.title}
                            </h2>
                            <p className="text-xl text-gray-700 mb-8">
                                 {finalCta.textcontent}
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
