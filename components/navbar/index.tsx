"use client"

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isSticky, setIsSticky] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
                            src="/images/logo/logo.png"
                            alt="Hair-style.ai Logo"
                            width={32}
                            height={32}
                            className="mr-2"
                            priority
                        />
                        <span className="text-2xl font-semibold hover:text-purple-700 transition-colors" aria-label="Hair-style.ai">
                            Hair-style
                        </span>
                    </Link>
                </div>

                    {/* Navigation Links - 添加 ml-auto 使其靠右对齐 */}
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
                            FAQ
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