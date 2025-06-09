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

const before = '/images/buzzcutbefore.jpg'; 
const after = '/images/buzzcutafter.jpg';

// 可调整的图片显示高度配置
const IMAGE_DISPLAY_HEIGHT = 500; // 可以在这里修改图片高度 (200-800px)

// 配置评论内容
const testimonialsConfig = [
    {
        quote: "I wanted to try a buzz cut but wasn't sure if it would suit my face shape. This tool showed me exactly how it would look—clean, sharp, and surprisingly flattering!",
        author: "@Alex Chen",
        title: "Fitness Trainer", 
        rating: 4.9
    },
    {
        quote: "The buzz cut preview looked so realistic, I had to show all my friends. Perfect for trying bold looks without commitment!",
        author: "@Mike Rodriguez", 
        title: "Content Creator",
        rating: 4.8
    },
    {
        quote: "Amazing tool for anyone considering a major hair change. The buzz cut simulation helped me make the right decision - I love my new look!",
        author: "@Sarah Kim",
        title: "Lifestyle Blogger",
        rating: 5.0
    },
    {
        quote: "As someone dealing with hair loss, this helped me see how a buzz cut would look. It gave me the confidence to make the change!",
        author: "@David Wilson",
        title: "Business Owner", 
        rating: 4.7
    }
]

// 配置FAQ内容
const faqConfig = [
    {
        question: "What are the typical types of buzz cuts?",
        answer: "Buzz cuts come in different styles like the classic uniform buzz, fade buzz, crew cut, high and tight, and burr cut. Each type offers a different level of sharpness, texture, and face exposure depending on your style and comfort."
    },
    {
        question: "What would I look like with a buzz cut?",
        answer: "A buzz cut is bold and minimal, often making your face, eyes, and jawline stand out more. You can use Hairstyle AI to preview your buzz cut virtually and see exactly how it would look—realistic, easy, and no haircut needed."
    },
    {
        question: "What are the best apps for buzz cut filters?",
        answer: "The best buzz cut filter apps include Hairstyle AI, Fotor, and YouCam Makeup. Hairstyle AI is especially popular for its realistic results, wide style selection, and privacy-first design. It's fast, free, and doesn't require sign-up."
    },
    {
        question: "Is a buzz cut right for my face shape?",
        answer: "Buzz cuts generally suit oval, square, and long face shapes. They highlight the bone structure and jawline. If you're unsure, use Hairstyle AI to try different buzz cuts on your own face and find what flatters you best."
    },
    {
        question: "What if I regret getting a buzz cut? How do I survive the awkward phase?",
        answer: "If you regret it, don't worry—hair grows back fast. Use hats, headbands, or try styling products to control growth. The awkward phase usually lasts 2-4 weeks. Stay confident, and consider it a bold reset for your next look."
    },
    {
        question: "How long are #1, #2, and #3 buzz cuts?",
        answer: "A #1 buzz cut is about 1/8 inch (3mm), #2 is 1/4 inch (6mm), and #3 is 3/8 inch (10mm). The higher the number, the longer the cut—great for adjusting how bold or soft you want the look."
    },
    {
        question: "Is Hairstyle AI's simulation realistic?",
        answer: "Hairstyle AI uses advanced face mapping and lighting adjustments to deliver ultra-realistic results. It blends the buzz cut seamlessly with your head shape and facial features, so the final image looks like a real photo, not a filter."
    },
    {
        question: "What are the pros and cons of getting a buzz cut?",
        answer: "Buzz cuts are low-maintenance, stylish, and perfect for hot weather or active lifestyles. However, they can make scalp shape more visible and aren't ideal for covering uneven areas or thinning hair. Always try virtually first to decide."
    },
    {
        question: "Is the hairstyle try-on tool free?",
        answer: "Yes! Hairstyle AI is completely free to try. You can test up to five different hairstyles every day without paying or creating an account. No commitment, no subscription—just fast, fun, and easy virtual try-ons."
    },
    {
        question: "How do I use a buzz cut filter on Instagram?",
        answer: "Step 1: Use Hairstyle AI to generate your buzz cut look\nStep 2: Download the image to your phone\nStep 3: Open Instagram and upload it as a post or story\nStep 4: Tag with #buzzcutfilter to join the trend"
    },
    {
        question: "What if a buzz cut doesn't suit me—can I try other styles?",
        answer: "Yes! Hairstyle AI offers 60+ hairstyles and 19 colors for men and women. You can try bobs, long hair, curls, bangs, fades, and more. If buzz cuts aren't your style, there's always something else to explore—totally free."
    },
    {
        question: "Is my photo safe and private?",
        answer: "Absolutely. Hairstyle AI never stores your photos. Images are processed instantly and deleted right after. Your personal data is not saved or shared with anyone, so your privacy stays fully protected at all times."
    }
]

const structuredData = {
    metadataBase: new URL('https://hair-style.ai'),
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    url: 'https://hair-style.ai/buzz-cut-filter',
    name: 'Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women',
    description:
      "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Windows, MacOS, Linux, ChromeOS, Android, iOS, iPadOS',
    brand: {
      '@type': 'Brand',
      name: 'Hairstyle AI'
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
      ratingCount: '26155'
    }
  }

const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://hair-style.ai'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women',    
        item: 'https://hair-style.ai/buzz-cut-filter'
      }
    ]
  }

// AI Hairstyle 页面 metadata
export const metadata: Metadata = {
    title: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
    description: "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
    alternates: {
        canonical: 'https://hair-style.ai/buzz-cut-filter'
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
        title: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
        description: "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
        images: [
            {
                url: "https://hair-style.ai/images/buzzcutgirl.jpg",
                width: 1920,
                height: 1080,
                alt: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
                type: "image/jpeg"
            }
        ],
        siteName: "Hair-style.ai",
        locale: "en_US",
        type: "website",
        url: "https://hair-style.ai/buzz-cut-filter",
    },
    twitter: {
        card: "summary_large_image",
        site: "@hair_styleai",
        title: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
        description: "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
        images: ["https://hair-style.ai/images/buzzcutman2.jpg"]
    },

}

export default function BuzzCutFilterPage() {
    return (
        <>        
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                
                {/* Hero Section */}
                <section className="bg-white py-2 sm:py-10  mb-10 mt-2 sm:mt-6">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-center ">
                            {/* 左侧内容 */}
                            <div className="pr-8 order-2 lg:order-1">
                                <h1 className="text-3xl sm:text-5xl font-bold mb-6 text-gray-900">
                                    Buzz Cut Haircut Filter Online for Free
                                </h1>
                                <p className="text-lg md:text-2xl text-gray-600 mb-4 sm:mb-8 ">
                                    Transform your look instantly with our free AI buzz cut simulator. 
                                    Just upload a photo and preview a fresh, bold buzz cut in 
                                    seconds—no haircut, no commitment, just a smarter way to 
                                    find your perfect style.
                                </p>
                                
                                {/* 统计数据 */}
                                <div className="flex items-center gap-3 mb-8 mt-16">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const rating = 4.8;
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
                                    <span className="text-gray-600 font-medium text-sm sm:text-base">    258,000+ virtual hairstyles transformed</span>
                                </div>
                                
                                <Link 
                                    href="/ai-hairstyle?style=buzzcut"
                                    className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                >
                                    Try Buzz Cut Filter
                                    <i className="fas fa-arrow-right  "></i>
                                </Link>
                            </div>
                            
                            {/* 右侧对比图片 */}
                            <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                                <BeforeAfterSlider
                                    beforeImage={before}
                                    afterImage={after}
                                    beforeAlt="Before buzz cut - original hairstyle"
                                    afterAlt="After buzz cut - transformed hairstyle with short buzz cut"
                                    height={IMAGE_DISPLAY_HEIGHT}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Before & After Gallery */}
                <LazySection>
                    <section className="py-2 sm:py-20 bg-gray-50">
                        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                            <div className="text-center mb-16">
                                <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
                                    Buzz Cut Transformations
                                </h2>
                                <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                                    See the dramatic difference a buzz cut can make. Our AI filter shows 
                                    you exactly how this clean, sharp look will suit your face.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                                    <Image
                                        src="/images/buzzcutman3.jpg"
                                        alt="Buzz cut transformation - man before and after"
                                        width={400}
                                        height={300}
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                                

                                
                                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                                    <Image
                                        src="/images/buzzcutgirl.jpg"
                                        alt="Buzz cut transformation - woman before and after"
                                        width={400}
                                        height={300}
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </LazySection>

                {/* Is Buzz Cut Right for Me Section */}
                <LazySection>
                <section className="py-10 sm:py-20 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <h2 className="text-2xl sm:text-4xl font-bold mb-12 text-center text-gray-800">
                            Is Buzz Cut Right for Me?
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* 左侧表格 */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-6 py-4 grid grid-cols-2 gap-4">
                                    <div className="font-semibold text-gray-800">Feature</div>
                                    <div className="font-semibold text-gray-800">Description</div>
                                </div>
                                
                                <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                                    <div className="font-medium text-gray-800">Best Face Shapes</div>
                                    <div className="text-gray-600">Oval, Square, Long</div>
                                </div>
                                
                                <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                                    <div className="font-medium text-gray-800">Popularity in 2025</div>
                                    <div className="text-gray-600 flex items-center">
                                        <span className="text-yellow-400">★★★★★</span>
                                        <span className="ml-2">4.8/5.0</span>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                                    <div className="font-medium text-gray-800">Style Type</div>
                                    <div className="text-gray-600">Bold, minimalist, low-maintenance</div>
                                </div>
                                
                                <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
                                    <div className="font-medium text-gray-800">Length</div>
                                    <div className="text-gray-600 ">Very short, even or faded sides</div>
                                </div>
                                
                                <div className="px-6 py-4 grid grid-cols-2 gap-4">
                                    <div className="font-medium text-gray-800">Maintenance Level</div>
                                    <div className="text-gray-600">Extremely low - just occasional trimming</div>
                                </div>
                            </div>
                            
                            {/* 右侧文本 */}
                            <div className="space-y-4 text-gray-600 text-base leading-relaxed">
                                <p>
                                    A buzz cut can look amazing—but it's not one-style-fits-all. The key is whether it works with your face shape. Buzz cuts usually flatter oval, square, or long faces. These shapes balance well with short sides and an open forehead.
                                </p>
                                <p>
                                    If you have a round or wide face, don't worry—you can still try various faded or slightly longer buzz cuts to add definition.
                                </p>
                                <p>
                                    The easiest way to know? Use Hairstyle AI. Upload your photo and see what a buzz cut would actually look like on you. It takes less than a minute.
                                </p>
                                <p>
                                    No guessing, no awkward barber visits, no regrets. You'll get a realistic preview, and if it doesn't work? Just try something else.
                                </p>
                                <p>
                                    Buzz cuts are bold, clean, and super low-maintenance—but not everyone is ready to commit. That's why trying it virtually is the smart move.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                </LazySection>

                {/* How to Use Buzz Cut Filter Section */}
                <LazySection>
                <section className="py-10 sm:py-20 bg-gray-50">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 ">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
                                How to Use Buzz Cut Filter
                            </h2>
                            <p className="text-base text-gray-600 max-w-5xl mx-auto">
                                It only takes a few steps to see yourself with a buzz cut. No haircut, no stress—just upload, generate, and share your new look in seconds.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ">
                            {/* 左侧步骤 */}
                            <div className="space-y-6 order-2 lg:order-1">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                                        <i className="fas fa-upload mr-2 text-purple-600"></i>
                                        Step 1: Upload Your Photo
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Take or choose a clear photo showing your full face. Make sure your photo is front-facing, with good lighting and no hair covering your forehead. You can upload PNG, JPG or JPEG files up to 3MB. The clearer your face, the more realistic your buzz cut result will look.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                                        <i className="fas fa-palette mr-2 text-purple-600"></i>
                                        Step 2: Choose Your Buzz Cut Style
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Pick your favorite buzz cut length and color. You can try over 60 different hairstyles and 19 hair colors. Whether you want a classic short cut or a modern fade, just pick what fits your vibe. Want something bold? Try a bright color or a sharp crew cut look.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                                        <i className="fas fa-magic mr-2 text-purple-600"></i>
                                        Step 3: Generate Your Look
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Click the 'Generate' button and let AI work its magic. Hairstyle AI will analyze your face shape and features to give you a realistic buzz cut preview. The process takes about 60 seconds. No sign-up, no downloads—just wait a moment and see your transformation appear.
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                                        <i className="fas fa-download mr-2 text-purple-600"></i>
                                        Step 4: Download or Share
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Save your new look or show it off to friends. Once your new hairstyle is ready, you can download the image to your device or share it directly on TikTok, Instagram, or with friends. It's a fun way to explore your style or prank someone—with no regrets.
                                    </p>
                                </div>
                                
                                <Link 
                                    href="/ai-hairstyle?style=buzzcut"
                                    className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                >
                                    Try Buzz Cut Filter
                                    <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                            
                            {/* 右侧占位图 */}
                            <div className="flex justify-center order-1 lg:order-2">
                                <div className="w-full max-w-3xl bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                                    <Image
                                        src="/images/buzzcuthowto.jpg"
                                        alt="How to use buzz cut filter - step by step demonstration"
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

                {/* First CTA Section */}
                <section className="py-20 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="max-w-full mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                {/* 左侧占位图 */}
                                <div className="flex justify-center">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-lg">
                                        <Image
                                            src="/images/buzzcutman1.jpg"
                                            alt="Buzz cut transformation before and after - man"
                                            width={800}  
                                            height={600}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                                
                                {/* 右侧文本内容 */}
                                <div className="space-y-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                    Preview Your Buzz Cut Before the Barber Does It for Free    
                                    </h2>
                                    <p className="text-lg text-gray-800 leading-relaxed">
                                        Thinking of going bold with a buzz cut? Don't risk it without seeing the look first. With Hairstyle AI, you can try on your buzz cut virtually before making a permanent change. Upload a photo, choose the style and length, and preview your new look in seconds. It's the smart way to decide if a buzz cut suits your face shape, features, or lifestyle—without picking up the clippers. Perfect for first-timers or anyone thinking about a major hair reset.
                                    </p>
                                    
                                    <Link 
                                        href="/ai-hairstyle?style=buzzcut"
                                        className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                    >
                                        Try Buzz Cut Filter
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Try a Bold Look Section */}
                <section className="py-2 sm:py-20  bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="max-w-full mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                {/* 左侧文本内容 */}
                                <div className="space-y-6 order-2 lg:order-1">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                        Try a Bold Look Just for Fun
                                    </h2>
                                    <p className="text-lg text-gray-800 leading-relaxed">
                                        Not planning a real haircut but curious how you'd look with a buzz cut? Use Hairstyle AI to generate a bold, buzzed version of you—just for fun. It's a great way to surprise friends, prank someone with a fake haircut reveal, or create content for TikTok and Instagram. The results look so real, people might think you actually shaved your head. Try it in different colors or fade styles and see which one gets the best reaction.
                                    </p>
                                    
                                    <Link 
                                        href="/ai-hairstyle?style=buzzcut"
                                        className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                    >
                                        Try Buzz Cut Filter
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                                
                                {/* 右侧占位图 */}
                                <div className="flex justify-center order-1 lg:order-2">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-lg">
                                        <Image
                                            src="/images/buzzcutgirl1.jpg"
                                            alt="Fun buzz cut transformation - girl having fun with virtual hairstyle"
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

                {/* Hair Loss Section */}
                <section className="py-20 bg-white">
                    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="max-w-full mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                {/* 左侧占位图 */}
                                <div className="flex justify-center">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-lg">
                                        <Image
                                            src="/images/buzzcutman.jpg"
                                            alt="Buzz cut solution for hair loss - confident man with buzz cut"
                                            width={800}
                                            height={600}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                                
                                {/* 右侧文本内容 */}
                                <div className="space-y-6">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                            Test a Buzz Cut If You're Dealing With Hair Loss
                                    </h2>
                                    <p className="text-lg text-gray-800 leading-relaxed">
                                        If you're thinking about buzzing your hair due to thinning or hairline concerns, Hairstyle AI can help you test the look first. Upload your photo and try realistic buzz cuts that match your face shape and head structure. It's a pressure-free way to explore low-maintenance options that still look sharp and confident. Many users find that going short boosts their self-image—start with a virtual try-on and take control of your next style move.
                                    </p>
                                    
                                    <Link 
                                        href="/ai-hairstyle?style=buzzcut"
                                        className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                    >
                                        Try Buzz Cut Filter
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Explore New Styles Section */}
                <section className="py-2 sm:py-20 bg-white">
                    <div className="w-full px-2 sm:px-4 lg:px-6">
                        <div className="max-w-6xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                {/* 左侧文本内容 */}
                                <div className="space-y-6 order-2 lg:order-1">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                        Explore New Styles Without Any Regrets
                                    </h2>
                                    <p className="text-lg text-gray-800 leading-relaxed">
                                        Want to refresh your image but not ready for real change? The buzz cut filter lets you experiment with short, edgy styles without touching a single hair. Try different buzz lengths, gradients, and colors in seconds—no appointments, no commitment. It's a fun and empowering way to explore what fits you best. Use it as a style preview, self-expression tool, or even just to boost your confidence with a brand-new look.
                                    </p>
                                    
                                    <Link 
                                        href="/ai-hairstyle?style=buzzcut"
                                        className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                                    >
                                        Try Buzz Cut Filter
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                                
                                {/* 右侧占位图 */}
                                <div className="flex justify-center order-1 lg:order-2">
                                    <div className="w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-lg">
                                        <Image
                                            src="/images/buzzcutgirl2.jpg"
                                            alt="Explore new buzz cut styles without regrets"
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

                {/* Why Choose Our Buzz Cut Simulator Section */}
                <LazySection>
                <section className="py-10 mt-10 bg-white">
                    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2 sm:mb-6 text-gray-800">
                                Why Choose Our Buzz Cut Simulator?
                            </h2>
                        </div>
                        
                        <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                            {/* Easy & Free to Use */}
                            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                                    <i className="fas fa-hand-point-up text-4xl text-purple-600 mb-6"></i>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Easy & Free to Use</h3>
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                    No sign-ups, no downloads—just upload a photo and click "Generate." Whether you're tech-savvy or not, anyone can try new hairstyles in seconds. It's free, fast, simple, and works right in your browser on mobile or desktop.
                                </p>
                            </div>

                            {/* Various Haircuts and Colors */}
                            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                                    <i className="fas fa-palette text-4xl text-purple-600 mb-6"></i>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Various Haircuts and Colors</h3>
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                    Choose from 60+ haircuts and 19 hair colors, from bold buzz cuts to trendy bangs and soft curls. You can mix and match styles and shades until you find the perfect look that fits your vibe.
                                </p>
                            </div>

                            {/* Realistic, Natural Results */}
                            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                                    <i className="fas fa-award text-4xl text-purple-600 mb-6"></i>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Realistic, Natural Results</h3>
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                    Our AI is built to match your face shape, lighting, and angles—so the final look feels real. No cartoon effects or fake overlays—just believable, photo-quality transformations that help you decide with confidence.
                                </p>
                            </div>

                            {/* Privacy Comes First */}
                            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                                    <i className="fas fa-shield-alt text-4xl text-purple-600 mb-6"></i>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Privacy Comes First</h3>
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                    We never save your photos. Everything is processed instantly and deleted after use. You can explore new hairstyles safely, knowing your personal data stays private and secure every time.
                                </p>
                            </div>
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
                                 How Would I Look With a Buzz Cut?
                            </h2>
                            <p className="text-xl text-gray-700 mb-8">
                                 Upload your photo and try our free AI buzz cut filter—realistic, fast, and totally risk-free.
                            </p>
                            <Link 
                                href="/ai-hairstyle?style=buzzcut"
                                className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                            >
                                Try Buzz Cut Filter →
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </>
    )
}