"use client"

import { useState, useEffect, useRef } from 'react';
import { femaleStyles, maleStyles, hairColors, HairStyle } from '@/libs/hairstyles';
import MoreFreeAITools from '@/components/MoreFreeAITools';
import Image from 'next/image';
import Link from 'next/link';


type TabType = 'Female' | 'Male' | 'Color';

// Add image skeleton component
const ImageSkeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 ${className}`} />
);

// Add optimized image component
const OptimizedImage = ({ 
    src, 
    alt, 
    width, 
    height, 
    className = "", 
    priority = false,
    aspectRatio = "1:1"
}: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;
    aspectRatio?: string;
}) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    const handleLoad = () => setImageLoaded(true);
    const handleError = () => {
        if (imageSrc.endsWith('.webp')) {
            // Try jpg format
            const jpgSrc = imageSrc.replace('.webp', '.jpg');
            setImageSrc(jpgSrc);
        } else if (imageSrc.endsWith('.jpg')) {
            // Try webp format
            const webpSrc = imageSrc.replace('.jpg', '.webp');
            setImageSrc(webpSrc);
        } else {
            // If both failed, show error state
            setHasError(true);
            setImageLoaded(true);
        }
    };

            // If image loading failed, show placeholder
    if (hasError) {
        return (
            <div className={`relative ${className} bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center`} style={{ aspectRatio }}>
                <div className="text-center px-4">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-sm text-gray-500">{alt}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} style={{ aspectRatio }}>
            {!imageLoaded && (
                <ImageSkeleton className="absolute inset-0 rounded-lg" />
            )}
            <Image
                src={imageSrc}
                alt={alt}
                width={width}
                height={height}
                className={`${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full h-full object-cover rounded-lg`}
                onLoad={handleLoad}
                onError={handleError}
                priority={priority}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    );
};

export default function Hero() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('Female');
    const [displayStyles, setDisplayStyles] = useState<HairStyle[]>([]);
    const [displayColors, setDisplayColors] = useState<Array<{id: string; color: string; label: string}>>([]);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
    const [error, setError] = useState<Error | null>(null);
    const [expandedFAQs, setExpandedFAQs] = useState(new Set());
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Move review data to component internal
    const testimonials = [
        {
            quote: "I've always been hesitant to try on new hairstyles because I wasn't sure how they'd look on me. With AI hairstyle changer, I uploaded my photo and tried out different styles, which gave me the confidence to switch to a modern fade. It's a game-changer for anyone unsure about new looks.",
            name: "Mark",
            title: "Financial Analyst"
        },
        {
            quote: "As a professional photographer, I needed to visualize different hairstyles for my clients before photoshoots. AI hairstyle changer has become an essential part of my pre-shoot consultation. It helps clients make confident decisions about their styling and saves us both time and uncertainty.",
            name: "Emily",
            title: "Professional Photographer"
        },
        {
            quote: "The accuracy of AI hairstyle changer is impressive! I was skeptical at first, but after trying several hairstyles, I found the perfect look for my wedding day. The ability to experiment with different colors and styles helped me avoid any styling regrets on my big day.",
            name: "Sophie",
            title: "Interior Designer"
        },
        {
            quote: "Working in tech, I appreciate tools that combine innovation with practicality. AI hairstyle changer does exactly that. It's intuitive, fast, and surprisingly accurate. I used it before my recent makeover and the actual result matched the preview perfectly.",
            name: "James",
            title: "Software Developer"
        },
        {
            quote: "Being a style consultant, I recommend AI hairstyle changer to all my clients. It's revolutionized how we approach hair makeovers. The realistic previews and variety of options make it easy for clients to visualize their transformation. It's become an indispensable tool in my consulting process.",
            name: "Lisa",
            title: "Style Consultant"
        }
    ];

    // FAQ items inside the component
    const faqItems = [
        {
            question: "What is AI Hairstyle Changer?",
            answer: "AI Hairstyle Changer is a free online tool. You upload a selfie, pick from 60+ hairstyles and 19 colors, and it puts the new hair on your photo."
        },
        {
            question: "Is it really free to use AI Hairstyle Changer?",
            answer: "Yes, our AI Hairstyle Changer are completely free to use. You can upload your image, try on AI virtual hairstyles, and experiment with different colors without any cost and no sign-up needed."
        },
        {
            question: "How does AI Hairstyle Changer work?",
            answer: "Step 1: Upload your photo. Step 2: Choose a hairstyle. Step 3: Pick a color. Step 4: See your new look! Easy online hairstyle changer for men and women."
        },
        {
            question: "What file formats are supported?",
            answer: "You can upload JPG and PNG photos. The photo hair editor online free works best with clear, front-facing selfies."
        },
        {
            question: "Is there an AI hairstyle changer that lets you try on different hairstyles?",
            answer: "Yes! AI hairstyle changer is a versatile hairstyle changer. You can try short, long, men's, or women's AI virtual hairstyles easily."
        },
        {
            question: "How do I change my hairstyle with Hairstyle AI?",
            answer: "Step 1: Go to AI hairstyle changer. Step 2: Upload your picture. Step 3: Pick a style and color. Step 4: Download your new hairstyle photo!"
        },
        {
            question: "Is it safe to upload my image to AI hairstyle changer?",
            answer: "Absolutely! We take your privacy seriously. Your uploaded images are processed securely and are not stored permanently. We use advanced encryption to protect your data, and all images are automatically deleted after processing."
        },
        {
            question: "Can I use AI Hairstyle Changer on my phone?",
            answer: "Yes! Our AI haircut simulator tools are fully mobile-responsive and works perfectly on smartphones and tablets. You can easily upload photos from your mobile device and try on different hairstyles on the go."
        },
        {
            question: "How to try on versatile haircut on my face?",
            answer: "It's simple! Just upload a clear photo of your face, select from our wide range of hairstyle options, and AI hairstyle changer will automatically apply the chosen style to your photo. You can also experiment with different hair colors to find your perfect look."
        },
        {
            question: "Is there an AI hairstyle changer that lets you try on different hairstyles?",
            answer: "Yes! AI hairstyle changer is a free online AI hairstyle changer. You can try short, long, men's, or women's versatile hairstyle easily."
        },
        {
            question: "Can AI hairstyle changer fix my hair in a photo?",
            answer: "Yes! The AI hairstyle changer lets you fix or completely change your hair in pictures. It's the AI hairstyle changer."
        },
        {
            question: "What is the AI hairstyle changer that changes hair color?",
            answer: "AI hairstyle changer is the AI Virtual generator that changes hair color. You can pick from 19 colors when testing hairstyles on your face free."
        },
        {
            question: "Can AI hairstyle changer tell me what hairstyle suits me?",
            answer: "While our AI hairstyle changer help you visualize different hairstyles on your face, the best hairstyle choice ultimately depends on your personal preference and style. We recommend trying multiple styles and colors to find what makes you feel most confident."
        }
    ];

    // Add image error handling function
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = '/images/fallback/hairstyle-placeholder.jpg'; // Use placeholder image
    };

    // Define color image mapping
    const colorImages = {
        black: "/images/colors/black-hair.jpg",
        red: "/images/colors/red-hair.jpg",
        silver: "/images/colors/silver-hair.jpg",
        purple: "/images/colors/purple-hair.jpg",
        blue: "/images/colors/blue-hair.jpg",
        pink: "/images/colors/pink-hair.jpg",
        brown: "/images/colors/brown-hair.jpg",
        green: "/images/colors/green-hair.jpg",
        orange: "/images/colors/orange-hair.jpg",
        white: "/images/colors/white-hair.jpg",
        lightBrown: "/images/colors/light-brown-hair.jpg",
        lightBlue: "/images/colors/light-blue-hair.jpg",
        blonde: "/images/colors/blonde-hair.jpg",
        lightPurple: "/images/colors/light-purple-hair.jpg"
    };

    // Data update function
    const updateDisplayData = (tabType: TabType) => {
        if (tabType === 'Color') {
            // Only show color options with corresponding images
            const availableColors = hairColors.filter(color => 
                // Check if color ID exists in colorImages
                color.id in colorImages
            );
            setDisplayColors(availableColors);
            setDisplayStyles([]);
            console.log(`Switched to ${tabType} - showing ${availableColors.length} color options`);
        } else {
            // For hairstyle tabs, set all style data
            const styles = tabType === 'Female' ? femaleStyles : maleStyles;
            setDisplayStyles(styles);
            setDisplayColors([]);
            console.log(`Switched to ${tabType} - showing ${styles.length} hairstyle options`, styles.slice(0, 3).map(s => s.description));
        }
    };

    useEffect(() => {
        // Get corresponding data based on selected tab
        updateDisplayData(activeTab);
    }, [activeTab]);

    // Review navigation functions
    const handlePrevious = () => {
        setCurrentTestimonial(prev => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentTestimonial(prev => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    const toggleFAQ = (index: number) => {
        const newSet = new Set(expandedFAQs);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setExpandedFAQs(newSet);
    };

    // Add client-side mount check to avoid hydration errors
    useEffect(() => {
        setMounted(true);
        // Load initial data immediately when component mounts
        updateDisplayData(activeTab);
    }, []);

    // Auto scroll functionality for hairstyle grid
    useEffect(() => {
        if (!mounted || activeTab === 'Color' || !isAutoScrolling) return;

        const container = scrollContainerRef.current;
        if (!container) return;

        const autoScroll = setInterval(() => {
            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            
            if (container.scrollLeft >= maxScrollLeft) {
                // If reached the end, scroll back to start
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                // Scroll right by 200px
                container.scrollBy({ left: 200, behavior: 'smooth' });
            }
        }, 1000); // Auto scroll every 3 seconds

        return () => clearInterval(autoScroll);
    }, [mounted, activeTab, isAutoScrolling]);

    // Handle user interaction to pause auto scroll
    const handleScrollInteraction = () => {
        setIsAutoScrolling(false);
        // Resume auto scrolling after 5 seconds of no user interaction
        setTimeout(() => setIsAutoScrolling(true), 5000);
    };

    if (!mounted) {
        return null; // Avoid showing content before client-side mount, prevent hydration errors
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <h2>Something went wrong</h2>
                <button
                    onClick={() => setError(null)}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <section className="relative overflow-hidden">
            <div className="container mx-auto px-4 py-4 md:py-8 mb-6 md:mb-10">
                <div className="grid grid-cols-1 lg:grid-cols-2  gap-2 items-center max-w-6xl mx-auto ">
                    {/* Right image - mobile first display */}
                    <div className="flex justify-center lg:order-2">
                        <div className="w-full max-w-sm lg:max-w-lg mx-auto" style={{ aspectRatio: '4:3' }}>
                            <OptimizedImage
                                src="/images/optimized/hero/hero4.webp"
                                alt="AI Hairstyle Preview - Showcase of before and after hairstyle transformations using artificial intelligence"
                                className="w-full h-full"
                                width={700}
                                height={700}
                                priority={true}
                                aspectRatio="4:3"
                            />
                        </div>
                    </div>

                    {/* Left content */}
                    <div className="text-center lg:text-left lg:order-1">
                            <h1 className="text-3xl sm:text-5xl font-bold mb-3 lg:mb-6 mt-1 lg:mt-10 text-gray-800">
                                Free AI Hairstyle Changer Online - for Men and Women
                            </h1>
                            
                            <p className="text-base sm:text-lg text-gray-800 mb-4">
                                Not sure which hairstyle suits you best? Upload photo, let our free AI hairstyle changer help you try on  <span className="font-bold">60+ hairstyles and 19 colors filters</span> in just a few clicks! 
                                Whether you want short, curly, wavy or bold hairstyles like buzz cuts and braids, Hairstyle AI helps you experiment without a trip to the salon.
                            </p>

                            <p className=" text-gray-800 text-lg mb-4">
                                Whether you need online hairstyles for <span className="font-bold">men or women</span>, this tool has it all. Hairstyle try on has never been easier – upload your photo and explore the best styles!
                            </p>

                                {/* Rating */}
                                {/* 用户头像和统计文本 */}
                                <div className="flex items-start justify-center lg:justify-start gap-3 mb-6">
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
                                            {[...Array(5)].map((_, i) => (
                                                <svg 
                                                    key={i}
                                                    className="w-5 h-5 text-yellow-400" 
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        {/* 统计文本 */}
                                        <span className="text-base text-gray-800">4.9/5 from 50k+ users</span>
                                    </div>
                                </div>

                            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-6 mt-6">
                                <Link 
                                    href="/ai-hairstyle" 
                                    className="btn bg-purple-700 hover:bg-purple-800 text-white btn-lg rounded-2xl px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300"
                                >
                                    Try on Now
                                </Link>
                        </div>
                    </div>


                </div>
            </div>

            {/* Second section: Hairstyle display area */}
            <div className="container mx-auto px-4 pb-20">
                <div className="max-w-6xl mx-auto">
                    {/* Title and description */}
                    <div className="text-center mb-16">
                        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
                            Try on Popular Hairstyles for Men and Women with Hairstyle AI
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-5xl mx-auto leading-relaxed">
                              Looking for hairstyle inspiration? Our AI hairstyle changer helps you explore the hottest hairstyles for men and women in seconds! Whether you want a classic cut, bold fade, curly waves, or a sleek ponytail, AI hairstyle changer makes it super easy. No more guessing—just upload your photo, try on different AI hairstyle simulators, and find your perfect look! Ready for a new hairstyle? Give it a try today!
                        </p>
                    </div>

                    {/* Tab switching */}
                    <div className="flex justify-center mb-12 px-4">
                        <div className="flex rounded-lg overflow-hidden w-full max-w-md">
                            {(['Female', 'Male', 'Color'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        // Update data immediately to ensure state sync
                                        updateDisplayData(tab);
                                    }}
                                    className={`flex-1 py-3 text-base sm:text-base font-medium transition-all ${
                                        activeTab === tab
                                            ? 'bg-purple-700 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>


                    {/* hairstyle/color grid */}
                    <div className="relative">
                            {activeTab === 'Color' ? (
                                // color options display - keep original grid layout
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 overflow-hidden">
                                    {displayColors.map((color, index) => (
                                        <div key={index} className="group transition-all duration-300 hover:scale-105">
                                            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-3 relative">
                                                {colorImages[color.id as keyof typeof colorImages] ? (
                                                    <OptimizedImage
                                                        src={colorImages[color.id as keyof typeof colorImages]}
                                                        alt={color.label}
                                                        className="group-hover:opacity-90 transition-opacity"
                                                        width={400}
                                                        height={300}
                                                        aspectRatio="4:3"
                                                    />
                                                ) : (
                                                    // if no corresponding image, display color block
                                                    <div 
                                                        className="w-full h-full"
                                                        style={{ 
                                                            background: color.id === 'random' ? color.color : color.color,
                                                            opacity: 0.8 
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <p className="text-center text-gray-800 font-medium">
                                                {color.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // hairstyle options display - show all styles with auto horizontal scroll and 2 rows
                                <div 
                                    ref={scrollContainerRef}
                                    className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                                    onMouseEnter={handleScrollInteraction}
                                    onTouchStart={handleScrollInteraction}
                                    onScroll={handleScrollInteraction}
                                >
                                    <div className="grid grid-rows-2 grid-flow-col gap-4 pb-4 auto-cols-max">
                                        {displayStyles.map((style, index) => (
                                            <div key={`${activeTab}-${style.description}-${index}`} className="hairstyle-item transition-all duration-300 hover:scale-105 w-[140px] sm:w-[160px]">
                                                <div className="aspect-[3/4] hairstyle-image relative bg-gray-100 rounded-2xl overflow-hidden mb-2">
                                                    <OptimizedImage
                                                        key={`img-${activeTab}-${style.description}`}
                                                        src={style.imageUrl}
                                                        alt={style.description}
                                                        className="w-full h-full"
                                                        width={300}
                                                        height={300}
                                                        aspectRatio="4:3"
                                                    />
                                                </div>
                                                <h3 className="text-center text-gray-800 font-medium text-xs sm:text-sm leading-tight">
                                                    {style.description}
                                                </h3>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                    </div>

                    {/* More Style button */}
                    <div className="flex justify-center items-center relative mt-4">
                        <Link 
                            href="/ai-hairstyle"
                            className="btn bg-purple-700 text-white btn-lg rounded-xl"
                        >
                            Try on Free AI Hairstyle Changer Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* fourth part: How to try on hairstyles */}
            <div className="bg-white">
                <div className="container mx-auto px-4 py-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* image - mobile display on the top */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm order-1 lg:order-2">
                                <Image 
                                    src="/images/hero/ba3.jpg" 
                                    alt="Before and after comparison of hairstyle AI transformation showing dramatic style change"
                                    className="w-[340px] md:w-[440px] h-[350px] md:h-[450px] object-cover rounded-xl"
                                    width={440}
                                    height={450}
                                    onError={handleImageError}
                                   
                                />
                            </div>
                            {/* content - mobile display on the bottom */}
                            <div className="order-1 lg:order-2">
                                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
                                     How can I try on AI virtual hairstyles on my face?
                                </h2>
                                <p className="text-base sm:text-lg text-gray-600 mb-8">
                                    Do you worry that after getting a new hairstyle at the salon, it might not suit your face shape or style? 
                                    AI hairstyle changer helps you try on AI virtual hairstyles before making a decision. 
                                    Simply upload your photo, choose a popular hairstyle and instantly see how it looks on your face. 
                                    Want to test hairstyles on my face? Just upload your image and start exploring!
                                </p>
                                <Link 
                                    href="/ai-hairstyle"
                                    className="btn bg-purple-700 text-white btn-lg rounded-xl"
                                >
                                    Try on Free AI Hairstyle Changer Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* fifth part: What Haircut Fits */}
            
                <div className="container mx-auto px-4 py-4 sm:py-20">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* left side content */}
                            <div>
                                <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
                                    What Haircut Fits My Face?
                                </h2>
                                <div className="space-y-6 text-base sm:text-lg text-gray-600 ">
                                    <p>
                                        Choosing the right hairstyle depends on your face shape and the style you want to express.
                                    </p>
                                    <p>
                                        <Link href="/ai-hairstyle-male" className="font-bold text-purple-700 hover:text-purple-900 transition-colors">For Men</Link> if you have a round face try on a classic pompadour hairstyle or a side part with a fade. 
                                        These hairstyles create height and angles, making your face appear more defined. 
                                        For a square face, a softer, textured crop or quiff can add some flow and balance out sharp features.
                                    </p>
                                    <p>
                                        <Link href="/ai-hairstyle-online-free-female" className="font-bold text-purple-700 hover:text-purple-900 transition-colors">For Women</Link> a heart-shaped face suits hairstyles that balance the wider forehead, such as a soft side-swept bang with a long bob or wavy hair. 
                                        If you have an oval face, almost any hairstyle works, but a sleek pixie cut or a blunt bob can emphasize your facial features beautifully. 
                                        For a round face, a layered bob or long waves with side-swept bangs can elongate the face, adding sophistication and elegance.
                                    </p>
                                    <p>
                                        If you're still unsure, you can easily find your answer with our online AI hairstyle changer.
                                    </p>
                                </div>
                            </div>
                            
                            {/* right side image */}
                            <div className="flex justify-center lg:justify-end">
                                <Image 
                                    src="/images/hero/change.jpg" 
                                    alt="Multiple hairstyle options showcasing different looks on the same person using hairstyle AI technology"
                                    className="w-[300px] md:w-[430px] h-[320px] md:h-[470px] object-cover rounded-xl"
                                    width={430}
                                    height={470}
                                    onError={handleImageError}
                                 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            

            {/* sixth part: What is hairstyle AI changer */}
            <div className="bg-gray-50">
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* 左侧内容 */}
                            <div className="order-1 lg:order-2">
                                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                                    What is AI Hairstyle Changer?
                                </h2>
                                <p className="text-base sm:text-lg text-gray-600 mb-8">
                                    Are you still unsure about what hairstyle to wear for your next event? 
                                    Our AI hairstyle changer are here to help! Simply upload your photo, 
                                    choose a popular hairstyle like a sleek bob, trendy pixie cut, or bold pompadour, 
                                    and instantly see how it looks with different hair colors. You can easily experiment with 
                                    various hairstyles and colors to find the perfect match for your face and personality. 
                                    Try on AI hairstyle changer today and discover your ideal hairstyle in just a few clicks!
                                </p>
                                <Link 
                                    href="/ai-hairstyle"
                                    className="btn bg-purple-700 text-white btn-lg rounded-xl"
                                >
                                    Try on AI Hairstyle Changer Now
                                </Link>
                            </div>
                            {/* right side image */}
                            <div className="bg-gray-50 rounded-xl shadow-lg">
                                <Image 
                                    src="/images/hero/ba5.jpg" 
                                    alt="Side-by-side comparison demonstrating the power of AI haircut simulator technology"
                                    className="w-[600px] h-[290px] object-cover rounded-xl"
                                    width={600}
                                    height={290}
                                    onError={handleImageError}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            

            {/* third part: how to use */}
            
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* title and introduction */}
                    
                        <h2 className="text-2xl sm:text-4xl text-center font-bold mb-6 text-gray-800">
                            How to Change Hairstyle With Hairstyle AI
                        </h2>
                        <p className="text-base sm:text-lg text-gray-800 text-center mb-12">
                            Transform your hairstyle look with our AI hairstyle changer in just three simple steps. 
                            Upload your photo, choose from our diverse collection of hairstyles, and instantly see yourself with a new look!
                        </p>
                    

                    {/* 步骤说明卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-full mx-auto mb-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                                <Image 
                                    src="/images/steps/upload.jpg" 
                                    alt="Simple illustration showing how to upload your photo for AI haircut simulator "
                                    className="w-full h-full object-cover"
                                    width={400}
                                    height={300}
                                    onError={handleImageError}
                                  
                                />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">Step1: Upload Image</h3>
                            <p className="text-base md:text-lg text-gray-800">
                                Upload your photo if you want to change your hairstyle with AI hairstyle changer.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                                <Image 
                                    src="/images/steps/choose.jpg" 
                                    alt="Interactive interface demonstrating hairstyle and color selection process"
                                    className="w-full h-full object-cover"
                                    width={400}
                                    height={300}
                                    onError={handleImageError}
                                   
                                />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">Step2: Choose Hairstyle Filter and Hair Color</h3>
                            <p className="text-base md:text-lg text-gray-800">
                                Choose from our AI hairstyle changer, and pick the hairstyle filter and hair color you want to try.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                                <Image 
                                    src="/images/steps/download.jpg" 
                                    alt="Example of downloading your transformed hairstyle result"
                                    className="w-full h-full object-cover"
                                    width={400}
                                    height={300}
                                    onError={handleImageError}
                                  
                                />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">Step3: Download Photo!</h3>
                            <p className="text-base md:text-lg text-gray-800">
                                Our AI hairstyle changer will change your hairstyle. Once complete, download the photo with your new AI virtual hairstyle and see how the transformation suits you.
                            </p>
                        </div>
                    </div>

                    {/* add bottom button */}
                    
                    <div className="flex justify-center items-center relative mt-4">
                        <Link 
                            href="/ai-hairstyle"
                            className="btn bg-purple-700 text-white btn-lg rounded-xl"
                        >
                            Try on Free AI Hairstyle Changer Now
                        </Link>
                    </div>
                    
                </div>
            


            {/* More Free AI Tools Section */}
            
                <MoreFreeAITools toolNames={[
                    "Man Bun Filter",
                    "Textured Fringe Filter",
                    "Hairstyles for Girls",
                    "Dreadlocks Filter", 
                    "Bob Haircut Filter", 
                    "Men's Hairstyles", 
                    "Buzz Cut Filter", 
                    "Short Hair Filter", 
                    "AI Hairstyle Male", 
                    "AI Hairstyle Online Free Female",
                    "Hairstyle for Girls"]} />
            


            {/* seventh part: user testimonials */}
            <div id="testimonials" className="bg-white py-6 md:py-20 ">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl sm:text-4xl font-bold text-center mb-2 md:mb-16 text-gray-800">
                            What Users Are Saying About Hairstyle AI?
                        </h2>
                        
                        {/* 评价卡片 */}
                        <div className="relative bg-white rounded-2xl shadow-lg p-12">
                            {/* 引号装饰 */}
                            <div className="absolute top-8 left-8 text-gray-200" style={{ fontSize: '120px' }}>
                                "
                            </div>

                            {/* testimonial content */}
                            <div className="relative">
                                <p className="text-base md:text-lg text-gray-700 mb-8 italic">
                                    {testimonials[currentTestimonial].quote}
                                </p>

                                {/* user information */}
                                <div className="flex items-center gap-4">
                                    <Image
                                        src={`/images/reviewer/${testimonials[currentTestimonial].name.toLowerCase()}.jpg`}
                                        alt={`Profile photo of ${testimonials[currentTestimonial].name}, ${testimonials[currentTestimonial].title}`}
                                        className="w-16 h-16 rounded-full object-cover"
                                        width={64}
                                        height={64}
                                        onError={handleImageError}
                                    />
                                    <div>
                                        <p className="text-xl font-semibold">
                                            {testimonials[currentTestimonial].name}
                                        </p>
                                        <p className="text-gray-600">
                                            {testimonials[currentTestimonial].title}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* navigation buttons */}
                            <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full left-0 px-4">
                                <button
                                    onClick={handlePrevious}
                                    className="btn btn-circle btn-ghost -translate-x-20"
                                    aria-label="Previous testimonial"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="btn btn-circle btn-ghost translate-x-20"
                                    aria-label="Next testimonial"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div id="faq" className="bg-gray-50">
                <div className="container mx-auto px-4 py-2 md:py-20">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-4xl font-bold text-gray-800">
                                FAQs of AI Hairstyle Changer
                            </h2>
                        </div>

                        {/* FAQ Items - Split into two columns */}
                        <div className="flex flex-col md:flex-row gap-3 max-w-full mx-auto mt-12">
                            {/* Left Column */}
                            <div className="faq-column flex-1 space-y-4">
                                {faqItems.slice(0, Math.ceil(faqItems.length / 2)).map((item, index) => (
                                    <div 
                                        key={index}
                                        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-purple-100 hover:border-purple-200 transition-all duration-300 ease-in-out"
                                    >
                                        <button
                                            onClick={() => toggleFAQ(index)}
                                            className="w-full px-3 py-2 sm:px-4 sm:py-4 text-left flex justify-between items-center hover:bg-purple-50/50 transition-all duration-300"
                                        >
                                            <h3 className="text-base sm:text-lg  text-gray-700">{item.question}</h3>
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                                                <svg
                                                    className={`w-5 h-5 text-purple-600 transform transition-transform duration-300 ease-in-out ${
                                                        expandedFAQs.has(index) ? 'rotate-180' : ''
                                                    }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        <div
                                            className={`transition-all duration-300 ease-in-out ${
                                                expandedFAQs.has(index) 
                                                    ? 'max-h-[500px] opacity-100 scale-y-100 origin-top' 
                                                    : 'max-h-0 opacity-0 scale-y-95 origin-top'
                                            }`}
                                        >
                                            <div className={`px-6 pb-6 transform transition-all duration-300 ease-in-out ${
                                                expandedFAQs.has(index) 
                                                    ? 'translate-y-0 opacity-100' 
                                                    : 'translate-y-4 opacity-0'
                                            }`}>
                                                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">{item.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Column */}
                            <div className="faq-column flex-1 space-y-4">
                                {faqItems.slice(Math.ceil(faqItems.length / 2)).map((item, index) => (
                                    <div 
                                        key={index + Math.ceil(faqItems.length / 2)}
                                        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-purple-100 hover:border-purple-200 transition-all duration-300 ease-in-out"
                                    >
                                        <button
                                            onClick={() => toggleFAQ(index + Math.ceil(faqItems.length / 2))}
                                            className="w-full px-3 py-2 sm:px-4 sm:py-4 text-left flex justify-between items-center hover:bg-purple-50/50 transition-all duration-300"
                                        >
                                            <h3 className="text-base sm:text-lg  text-gray-700">{item.question}</h3>
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                                                <svg
                                                    className={`w-5 h-5 text-purple-700 transform transition-transform duration-300 ease-in-out ${
                                                        expandedFAQs.has(index + Math.ceil(faqItems.length / 2)) ? 'rotate-180' : ''
                                                    }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        <div
                                            className={`transition-all duration-300 ease-in-out ${
                                                expandedFAQs.has(index + Math.ceil(faqItems.length / 2)) 
                                                    ? 'max-h-[500px] opacity-100 scale-y-100 origin-top' 
                                                    : 'max-h-0 opacity-0 scale-y-95 origin-top'
                                            }`}
                                        >
                                            <div className={`px-6 pb-6 transform transition-all duration-300 ease-in-out ${
                                                expandedFAQs.has(index + Math.ceil(faqItems.length / 2)) 
                                                    ? 'translate-y-0 opacity-100' 
                                                    : 'translate-y-4 opacity-0'
                                            }`}>
                                                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">{item.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            

            {/* Call to Action after FAQ */}
            <div className="bg-white py-16 px-4">
                <div className="max-w-full mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Ready to Find Your Perfect Hairstyle with Hairstyle AI?</h2>
                    <p className="text-base md:text-xl text-gray-800 mb-10 max-w-3xl mx-auto">
                    Not sure which hairstyle suits you? Try on 60+ hairstyles for free with our AI hairstyle changer—upload your photo and find the perfect look in just a few clicks!
                    </p>


                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="btn bg-purple-700 text-white btn-lg rounded-xl"
                    >
                      Try AI Hairstyle Changer Now
                    </button>

                   
                </div>
            </div>
        </section>  

        
  
    );
}
    