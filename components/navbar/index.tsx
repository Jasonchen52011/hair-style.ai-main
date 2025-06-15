"use client"

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isSticky, setIsSticky] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

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
                            {[1, 2].map((i) => (
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
                ? 'fixed top-0 bg-white shadow-md z-50' 
                : 'relative bg-transparent'
        }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center h-22">
                        <Link href="/" className="flex items-center">
                        <Image
                                src="/images/logo/logo.png"
                                alt="Hairstyle.ai Logo"
                                width={32}
                                height={32}
                                className="mr-2"
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
                        
                        {/* Hairstyle Filter Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                            >
                                Hairstyle Filters
                                <svg 
                                    className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                        isDropdownOpen ? 'rotate-180' : ''
                                    }`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-2">
                                        <Link
                                            href="/buzz-cut-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Buzz Cut Filter
                                        </Link>
                                        <Link
                                            href="/bob-haircut-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Bob Haircut Filter
                                        </Link>
                                        <Link
                                            href="/bangs-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Bangs Filter
                                        </Link>
                                        <Link
                                            href="/ai-braids"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            AI Braids Filter
                                        </Link>
                                        <Link
                                            href="/pixie-cut-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Pixie Cut Filter
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
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