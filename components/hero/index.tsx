"use client"

import { useState, useEffect } from 'react';
import { femaleStyles, maleStyles, hairColors } from '@/components/selectstyle';
import Image from 'next/image';
import Link from 'next/link';

type TabType = 'Female' | 'Male' | 'Color';

export default function Hero() {
    const [activeTab, setActiveTab] = useState<TabType>('Female');
    const [displayStyles, setDisplayStyles] = useState<Array<{imageUrl: string; description: string}>>([]);
    const [displayColors, setDisplayColors] = useState<Array<{id: string; color: string; label: string}>>([]);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
    const [error, setError] = useState<Error | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [expandedFAQs, setExpandedFAQs] = useState(new Set());
    const itemsPerPage = 18;
    const autoPlayInterval = 3000; // 3秒轮播
    const [isPaused, setIsPaused] = useState(false);
    const pauseDuration = 5000; // 暂停 5 秒

    // 将评论数据移到组件内部
    const testimonials = [
        {
            quote: "I've always been hesitant to try new hairstyles because I wasn't sure how they'd look on me. With this tool, I uploaded my photo and tried out different styles, which gave me the confidence to switch to a modern fade. It's a game-changer for anyone unsure about new looks.",
            name: "Mark",
            title: "Financial Analyst"
        },
        {
            quote: "As a professional photographer, I needed to visualize different hairstyles for my clients before photoshoots. This tool has become an essential part of my pre-shoot consultation. It helps clients make confident decisions about their styling and saves us both time and uncertainty.",
            name: "Emily",
            title: "Professional Photographer"
        },
        {
            quote: "The accuracy of this tool is impressive! I was skeptical at first, but after trying several hairstyles, I found the perfect look for my wedding day. The ability to experiment with different colors and styles helped me avoid any styling regrets on my big day.",
            name: "Sophie",
            title: "Interior Designer"
        },
        {
            quote: "Working in tech, I appreciate tools that combine innovation with practicality. This hairstyle AI changer does exactly that. It's intuitive, fast, and surprisingly accurate. I used it before my recent makeover and the actual result matched the preview perfectly.",
            name: "James",
            title: "Software Developer"
        },
        {
            quote: "Being a style consultant, I recommend this tool to all my clients. It's revolutionized how we approach hair makeovers. The realistic previews and variety of options make it easy for clients to visualize their transformation. It's become an indispensable tool in my consulting process.",
            name: "Lisa",
            title: "Style Consultant"
        }
    ];

    // FAQ items inside the component
    const faqItems = [
        {
            question: "What is AI Hairstyle Changer?",
            answer: "AI Hairstyle Changer is a free online tool. You upload a selfie, pick from 56 hairstyles and 19 colors, and it puts the new hair on your photo."
        },
        {
            question: "Is it really free to use AI Hairstyle Changer?",
            answer: "Yes, our AI Hairstyle Changer tools are completely free to use. You can upload your image, try various hairstyles, and experiment with different colors without any cost and no sign-up needed."
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
            question: "Is there an AI app that lets you try different hairstyles?",
            answer: "Yes! AI Hairstyle Changer is a free online AI hairstyle generator. You can try short, long, men's, or women's hairstyles easily."
        },
        {
            question: "How do I change my hairstyle with AI?",
            answer: "Step 1: Go to AI Hairstyle Changer. Step 2: Upload your picture. Step 3: Pick a style and color. Step 4: Download your new hairstyle photo!"
        },
        {
            question: "Is it safe to upload my image to hairstyle AI changer tools?",
            answer: "Absolutely! We take your privacy seriously. Your uploaded images are processed securely and are not stored permanently. We use advanced encryption to protect your data, and all images are automatically deleted after processing."
        },
        {
            question: "Can I use AI Hairstyle Changer on my phone?",
            answer: "Yes! Our AI Hairstyle Changer tools are fully mobile-responsive and works perfectly on smartphones and tablets. You can easily upload photos from your mobile device and try different hairstyles on the go."
        },
        {
            question: "How to try hairstyle on my face?",
            answer: "It's simple! Just upload a clear photo of your face, select from our wide range of hairstyle options, and our AI will automatically apply the chosen style to your photo. You can also experiment with different hair colors to find your perfect look."
        },
        {
            question: "Is there an AI app that lets you try different hairstyles?",
            answer: "Yes! AI Hairstyle Changer is a free online AI hairstyle generator. You can try short, long, men's, or women's hairstyles easily."
        },
        {
            question: "Can AI fix my hair in a photo?",
            answer: "Yes! The AI Hairstyle Changer lets you fix or completely change your hair in pictures. It's the best free AI hairstyle generator."
        },
        {
            question: "What is the AI that changes hair color?",
            answer: "AI Hairstyle Changer is the AI that changes hair color. You can pick from 19 colors when testing hairstyles on your face free."
        },
        {
            question: "Can hairstyle AI changer tools tell me what hairstyle suits me?",
            answer: "While our hairstyle AI changer tools help you visualize different hairstyles on your face, the best hairstyle choice ultimately depends on your personal preference and style. We recommend trying multiple styles and colors to find what makes you feel most confident."
        }
    ];

    // 添加图片错误处理函数
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // 防止无限循环
        target.src = '/images/fallback/hairstyle-placeholder.jpg'; // 使用占位图
    };

    // 定义颜色图片映射
    const colorImages = {
        black: "/images/colors/black-hair.jpg",
        red: "/images/colors/red-hair.jpg",
        silver: "/images/colors/silver-hair.jpg",
        purple: "/images/colors/purple-hair.jpg",
        blue: "/images/colors/blue-hair.jpg",
        pink: "/images/colors/pink-hair.jpg",
        brown: "/images/colors/brown-hair.jpg",
        gray: "/images/colors/gray-hair.jpg",
        green: "/images/colors/green-hair.jpg",
        orange: "/images/colors/orange-hair.jpg",
        white: "/images/colors/white-hair.jpg",
        yellow: "/images/colors/yellow-hair.jpg",
        lightBrown: "/images/colors/light-brown-hair.jpg",
        lightBlue: "/images/colors/light-blue-hair.jpg",
        blonde: "/images/colors/blonde-hair.jpg",
        lightPurple: "/images/colors/light-purple-hair.jpg"
    };

    useEffect(() => {
        // 根据选中的标签获取对应的数据
        if (activeTab === 'Color') {
            // 只显示有对应图片的颜色选项
            const availableColors = hairColors.filter(color => 
                // 检查颜色ID是否在 colorImages 中存在
                color.id in colorImages
            );
            setDisplayColors(availableColors);
            setDisplayStyles([]);
        } else {
            const styles = activeTab === 'Female' ? femaleStyles : maleStyles;
            setDisplayStyles(styles.slice(0, 18).map(style => ({
                imageUrl: style.imageUrl,
                description: style.description
            })));
            setDisplayColors([]);
        }
    }, [activeTab]);

    // 计算总页数
    const getTotalPages = (styles: typeof femaleStyles) => {
        return Math.ceil(styles.length / itemsPerPage);
    };

    // 获取当前页的样式
    const getCurrentPageStyles = () => {
        const styles = activeTab === 'Female' ? femaleStyles : maleStyles;
        const start = currentPage * itemsPerPage;
        return styles.slice(start, start + itemsPerPage);
    };

    // 修改自动轮播逻辑
    useEffect(() => {
        // 如果处于暂停状态，不执行自动轮播
        if (isPaused) return;

        const timer = setInterval(() => {
            const totalPages = getTotalPages(activeTab === 'Female' ? femaleStyles : maleStyles);
            setCurrentPage(prev => (prev + 1) % totalPages);
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [activeTab, isPaused]); // 添加 isPaused 作为依赖项

    // 手动切换页面
    const handlePrevPage = () => {
        const totalPages = getTotalPages(activeTab === 'Female' ? femaleStyles : maleStyles);
        setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
        // 设置暂停状态
        setIsPaused(true);
        // 5秒后恢复自动轮播
        setTimeout(() => {
            setIsPaused(false);
        }, pauseDuration);
    };

    const handleNextPage = () => {
        const totalPages = getTotalPages(activeTab === 'Female' ? femaleStyles : maleStyles);
        setCurrentPage(prev => (prev + 1) % totalPages);
        // 设置暂停状态
        setIsPaused(true);
        // 5秒后恢复自动轮播
        setTimeout(() => {
            setIsPaused(false);
        }, pauseDuration);
    };

    // 评论导航函数
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
            <div className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto -mt-10">
                    {/* 左侧内容 */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl font-bold mb-6 mt-10 text-purple-800">
                            Free Hairstyles Changer Tools - Find Your Next Hairstyle in One Click!
                        </h1>

                        <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                            Not sure which hairstyle suits you best? Our free hairstyles changer lets you try on 56 styles in just a few clicks! Whether you want short, curly, wavy, or bold styles like buzz cuts and braids, this free hairstyles changer helps you experiment without a trip to the salon.Whether you need an online hairstyles changer for men or women, this tool has it all—from short cuts to long waves. It's an easy way to try on hairstyles for free without commitment. Love what you see? Save your favorite look and show it to your hairstylist! Try our hairstyles changer now and discover your next style!
                        </p>

                        <div className="flex flex-col lg:flex-row items-center gap-8">

                            <Link 
                                href="/ai-hairstyle" 
                                className="inline-flex items-center bg-purple-700 text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-purple-800 transition-colors"
                            >
                                Try Free Now
                                <svg 
                                    className="w-6 h-6 ml-2" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M17 8l4 4m0 0l-4 4m4-4H3" 
                                    />
                                </svg>
                            </Link>

                            {/* 评分 */}
                            <div className="flex items-center gap-2">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <svg 
                                            key={i}
                                            className="w-6 h-6 text-yellow-400" 
                                            fill="currentColor" 
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-xl text-gray-700">4.9/5 from 50k+ users</span>
                            </div>
                        </div>
                    </div>

                    {/* 右侧图片 */}
                    <div className="hidden lg:block">
                        <Image
                            src="/images/hero/hero4.jpg"
                            alt="AI Hairstyle Preview - Showcase of before and after hairstyle transformations using artificial intelligence"
                            className="w-full h-auto max-w-2xl mx-auto"
                            width={1024}
                            height={768}
                            onError={handleImageError}
                        />
                    </div>
                </div>
            </div>

            {/* 第二部分：发型展示区域 */}
            <div className="container mx-auto px-4 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* 标题和描述 */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-6 text-purple-800">
                            Popular Hairstyles for Men and Women
                        </h2>
                        <p className="text-lg text-gray-600 max-w-5xl mx-auto leading-relaxed">
                              Looking for hairstyle inspiration? Our free AI hairstyle changer helps you explore the hottest hairstyles for men and women in seconds! Whether you want a classic cut, bold fade, curly waves, or a sleek ponytail, this hairstyle changer online makes it super easy. No more guessing—just upload your photo, try on different styles, and find your perfect look! Ready for a new hairstyle? Give it a try today!
                        </p>
                    </div>

                    {/* 标签切换 */}
                    <div className="flex justify-center mb-12">
                        <div className="inline-flex rounded-lg overflow-hidden">
                            {(['Female', 'Male', 'Color'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-16 py-3 text-base font-medium transition-all ${
                                        activeTab === tab
                                            ? 'bg-purple-700 text-white'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 发型/颜色网格 */}
                    <div className="relative">
                        {/* 左右切换按钮 */}
                        <button
                            onClick={handlePrevPage}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-r-lg shadow-md hover:bg-white"
                            aria-label="Previous page"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 overflow-hidden">
                            {activeTab === 'Color' ? (
                                // 颜色选项展示
                                displayColors.map((color, index) => (
                                    <div key={index} className="group">
                                        <div className="aspect-square rounded-lg overflow-hidden mb-3 relative">
                                            {colorImages[color.id as keyof typeof colorImages] ? (
                                                <Image
                                                    src={colorImages[color.id as keyof typeof colorImages]}
                                                    alt={color.label}
                                                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                                    width={200}
                                                    height={200}
                                                    onError={handleImageError}
                                                />
                                            ) : (
                                                // 如果没有对应的图片，显示颜色块
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
                                ))
                            ) : (
                                // 发型选项展示
                                getCurrentPageStyles().map((style, index) => (
                                    <div key={style.style} className="hairstyle-item">
                                        <div className="hairstyle-image relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                                            <Image
                                                src={style.imageUrl}
                                                alt={style.description}
                                                className="w-full h-full object-cover"
                                                width={200}
                                                height={200}
                                                onError={handleImageError}
                                                loading="lazy"
                                            />
                                        </div>
                                        <h3 className="text-center text-gray-800 font-medium">
                                            {style.description}
                                        </h3>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={handleNextPage}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-l-lg shadow-md hover:bg-white"
                            aria-label="Next page"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* 页码指示器 */}
                        <div className="flex justify-center mt-4 gap-2">
                            {[...Array(getTotalPages(activeTab === 'Female' ? femaleStyles : maleStyles))].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-2 h-2 rounded-full ${
                                        currentPage === i ? 'bg-purple-600' : 'bg-gray-300'
                                    }`}
                                    aria-label={`Go to page ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* More Style 按钮 */}
                    <div className="text-center relative">
                        <Link 
                            href="/ai-hairstyle"
                            className="mt-4 inline-flex items-center justify-center px-8 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors text-lg font-medium"
                        >
                            Try Free Hairstyle Changer Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* 第三部分：使用步骤说明 */}
            <div id="how-to-use" className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    {/* 标题和介绍 */}
                    <div className="text-center max-w-5xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-6 text-purple-800">
                            How to Change Hairstyle Online with Hairstyle AI
                        </h2>
                        <p className="text-lg text-gray-600">
                            Transform your look with our hairstyle AI-powered changer in just three simple steps. 
                            Upload your photo, choose from our diverse collection of hairstyles, and instantly see yourself with a new look!
                        </p>
                    </div>

                    {/* 步骤说明卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                                <Image 
                                    src="/images/steps/upload.jpg" 
                                    alt="Simple illustration showing how to upload your photo for AI hairstyle transformation"
                                    className="w-full h-full object-cover"
                                    width={400}
                                    height={300}
                                    onError={handleImageError}
                                />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-purple-600">Step1: Upload Image</h3>
                            <p className="text-lg text-gray-600">
                                Upload your photo if you want to change your hairstyle with hairstyle AI changer tools.
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
                            <h3 className="text-2xl font-bold mb-2 text-purple-600">Step2: Choose Hairstyle and Color</h3>
                            <p className="text-lg text-gray-600">
                                Choose from our hairstyle AI changer tools, and pick the hair color you want to try.
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
                            <h3 className="text-2xl font-bold mb-2 text-purple-600">Step3: Download Photo!</h3>
                            <p className="text-lg text-gray-600">
                                Our hairstyle AI changer tools will change your hairstyle. Once complete, download the photo with your new virtual hairstyle and see how the transformation suits you.
                            </p>
                        </div>
                    </div>

                    {/* 添加底部按钮 */}
                    <div className="text-center mt-12">
                        <Link 
                            href="/ai-hairstyle"
                            className="inline-block bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-800 transition-colors"
                        >
                            Try Free Hairstyle AI Changer Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* 第四部分：How to try on hairstyles */}
            <div className="bg-gray-100">
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* 左侧内容 */}
                            <div>
                                <h2 className="text-3xl font-bold mb-6 text-purple-800">
                                    How to try on hairstyles on my face?
                                </h2>
                                <p className="text-lg text-gray-600 mb-8">
                                    Do you worry that after getting a new hairstyle at the salon, it might not suit your face shape or style? 
                                    Our free online hairstyle AI tool helps you try on different hairstyles before making a decision. 
                                    Simply upload your photo, choose a popular hairstyle and instantly see how it looks on your face. 
                                    Want to know how to try on hairstyles on your face? Just upload your image and start exploring!
                                </p>
                                <Link 
                                    href="/ai-hairstyle"
                                    className="inline-block bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-800 transition-colors"
                                >
                                    Try Free Hairstyle Changer Now
                                </Link>
                            </div>
                            {/* 右侧图片 */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <Image 
                                    src="/images/hero/ba3.jpg" 
                                    alt="Before and after comparison of hairstyle AI transformation showing dramatic style change"
                                    className="w-[440px] h-[450px] object-cover rounded-xl"
                                    width={440}
                                    height={450}
                                    onError={handleImageError}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 第五部分：What Haircut Fits */}
            <div className="bg-white">
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* 左侧图片 */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <Image 
                                    src="/images/hero/change.jpg" 
                                    alt="Multiple hairstyle options showcasing different looks on the same person using hairstyle AI technology"
                                    className="w-[430px] h-[470px] object-cover rounded-xl"
                                    width={430}
                                    height={470}
                                    onError={handleImageError}
                                    priority
                                />
                            </div>
                            {/* 右侧内容 */}
                            <div>
                                <h2 className="text-3xl font-bold mb-6 text-purple-800">
                                    What Haircut Fits My Face?
                                </h2>
                                <div className="space-y-6 text-lg text-gray-600 ">
                                    <p>
                                        Choosing the right hairstyle depends on your face shape and the style you want to express.
                                    </p>
                                    <p>
                                        For men, if you have a round face try a classic pompadour or a side part with a fade. 
                                        These styles create height and angles, making your face appear more defined. 
                                        For a square face, a softer, textured crop or quiff can add some flow and balance out sharp features.
                                    </p>
                                    <p>
                                        For women, a heart-shaped face suits styles that balance the wider forehead, such as a soft side-swept bang with a long bob or wavy hair. 
                                        If you have an oval face, almost any hairstyle works, but a sleek pixie cut or a blunt bob can emphasize your facial features beautifully. 
                                        For a round face, a layered bob or long waves with side-swept bangs can elongate the face, adding sophistication and elegance.
                                    </p>
                                    <p>
                                        If you're still unsure, you can easily find your answer with our free online AI hairstyle tool.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 第六部分：What is hairstyle AI changer */}
            <div className="bg-gray-100">
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* 左侧内容 */}
                            <div>
                                <h2 className="text-3xl font-bold mb-6 text-purple-800">
                                    What is hairstyle AI changer?
                                </h2>
                                <p className="text-lg text-gray-600 mb-8">
                                    Are you still unsure about what hairstyle to wear for your next event? 
                                    Our free online hairstyle AI changer tools are here to help! Simply upload your photo, 
                                    choose a popular hairstyle like a sleek bob, trendy pixie cut, or bold pompadour, 
                                    and instantly see how it looks with different hair colors. You can easily experiment with 
                                    various styles and colors to find the perfect match for your face and personality. 
                                    Try it today and discover your ideal hairstyle in just a few clicks!
                                </p>
                                <Link 
                                    href="/images/hero/ba.jpg"
                                    className="inline-block bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-800 transition-colors"
                                >
                                    Try Free Hairstyle Changer Now
                                </Link>
                            </div>
                            {/* 右侧图片 */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <Image 
                                    src="/images/hero/ba5.jpg" 
                                    alt="Side-by-side comparison demonstrating the power of AI hairstyle transformation technology"
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

            {/* 第七部分：用户评价 */}
            <div id="testimonials" className="bg-white py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-16 text-purple-800">
                            What Users Are Saying About Hairstyle AI?
                        </h2>
                        
                        {/* 评价卡片 */}
                        <div className="relative bg-white rounded-2xl shadow-lg p-12">
                            {/* 引号装饰 */}
                            <div className="absolute top-8 left-8 text-gray-200" style={{ fontSize: '120px' }}>
                                "
                            </div>

                            {/* 评价内容 */}
                            <div className="relative">
                                <p className="text-lg text-gray-700 mb-8 italic">
                                    {testimonials[currentTestimonial].quote}
                                </p>

                                {/* 用户信息 */}
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

                            {/* 导航按钮 */}
                            <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full left-0 px-4">
                                <button
                                    onClick={handlePrevious}
                                    className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors -translate-x-20"
                                    aria-label="Previous testimonial"
                                >
                                    <svg
                                        className="w-6 h-6 text-gray-600"
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
                                    className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors translate-x-20"
                                    aria-label="Next testimonial"
                                >
                                    <svg
                                        className="w-6 h-6 text-gray-600"
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
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-purple-800">
                                FAQs of AI Hairstyle
                            </h2>
                        </div>

                        {/* FAQ Items - Split into two columns */}
                        <div className="flex flex-col md:flex-row gap-4 max-w-6xl mx-auto mt-12">
                            {/* Left Column */}
                            <div className="faq-column flex-1 space-y-4">
                                {faqItems.slice(0, Math.ceil(faqItems.length / 2)).map((item, index) => (
                                    <div 
                                        key={index}
                                        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-purple-100 hover:border-purple-200 transition-all duration-300 ease-in-out"
                                    >
                                        <button
                                            onClick={() => toggleFAQ(index)}
                                            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-purple-50/50 transition-all duration-300"
                                        >
                                            <h3 className="text-lg font-semibold text-purple-700">{item.question}</h3>
                                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 transition-colors duration-300 hover:bg-purple-100">
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
                                                <p className="text-gray-600 text-lg leading-relaxed">{item.answer}</p>
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
                                            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-purple-50/50 transition-all duration-300"
                                        >
                                            <h3 className="text-lg font-semibold text-purple-700">{item.question}</h3>
                                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 transition-colors duration-300 hover:bg-purple-100">
                                                <svg
                                                    className={`w-5 h-5 text-purple-600 transform transition-transform duration-300 ease-in-out ${
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
                                                <p className="text-gray-600 text-lg leading-relaxed">{item.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>  
  
    );
}
    