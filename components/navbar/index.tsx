"use client"

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isSticky, setIsSticky] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => {
            if (typeof window !== 'undefined') {
                setIsSticky(window.scrollY > 0);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', handleScroll);
            handleScroll(); // 初始检查
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const scrollToSection = (id: string) => {
        if (typeof document !== 'undefined') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // 如果组件还没有挂载，返回一个占位导航栏
    if (!isMounted) {
        return (
            <nav className="w-full relative bg-transparent">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center h-22">
                            <div className="flex items-center">
                                <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full" />
                                <div className="w-32 h-8 bg-gray-200 rounded" />
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-1 ml-auto mr-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-24 h-8 bg-gray-200 rounded mx-2" />
                            ))}
                        </div>
                        <div className="w-32 h-10 bg-gray-200 rounded-full" />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className={`w-full ${
            isSticky 
                ? 'fixed top-0 bg-white shadow-md animate-slideDown z-50' 
                : 'relative bg-transparent'
        }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center h-22">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/images/logo/logo-192x192.png"
                                alt="Hairstyle.ai Logo"
                                width={32}
                                height={32}

                                priority
                            />
                            <span className="text-2xl font-semibold hover:text-purple-700" aria-label="Hair-style.ai">
                                Hairstyle AI
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1 ml-auto mr-8">
                        <Link 
                            href="/" 
                            className={`px-4 py-2 rounded-lg ${
                                pathname === '/' ? 'text-purple-700' : 'text-gray-700 hover:text-purple-700'
                            }`}
                        >
                            Home
                        </Link>
                        <button 
                            onClick={() => scrollToSection('how-to-use')}
                            className="px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                        >
                            How To Use
                        </button>
                        <button 
                            onClick={() => scrollToSection('testimonials')}
                            className="px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                        >
                            What Our Users Say
                        </button>
                        <button 
                            onClick={() => scrollToSection('faq')}
                            className="px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                        >
                            FAQs of AI Hairstyle
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center">
                        <Link 
                            href="/ai-hairstyle" 
                            className="px-6 py-2 bg-purple-700 text-white rounded-full hover:bg-purple-800 transition-colors"
                        >
                            Start For Free
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
} 