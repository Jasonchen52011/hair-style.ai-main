"use client"

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isSticky, setIsSticky] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isHairstyleDropdownOpen, setIsHairstyleDropdownOpen] = useState(false);
    const [isOtherToolsDropdownOpen, setIsOtherToolsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hairstyleDropdownRef = useRef<HTMLDivElement>(null);
    const otherToolsDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => {
            if (typeof window !== 'undefined') {
                setIsSticky(window.scrollY > 0);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', handleScroll);
            handleScroll(); // Initial check
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // Click outside to close dropdown menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (hairstyleDropdownRef.current && !hairstyleDropdownRef.current.contains(event.target as Node)) {
                setIsHairstyleDropdownOpen(false);
            }
            if (otherToolsDropdownRef.current && !otherToolsDropdownRef.current.contains(event.target as Node)) {
                setIsOtherToolsDropdownOpen(false);
            }
        };

        if (isDropdownOpen || isHairstyleDropdownOpen || isOtherToolsDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen, isHairstyleDropdownOpen, isOtherToolsDropdownOpen]);

    // If component is not mounted yet, return a placeholder navbar
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
                        <div className="hidden md:flex items-center space-x-1 ml-auto">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-24 h-8 bg-gray-200 rounded mx-2" />
                            ))}
                        </div>
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

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center space-x-1 ml-auto">
                        <Link 
                            href="/" 
                            className={`px-4 py-2 rounded-lg ${
                                pathname === '/' ? 'text-purple-700' : 'text-gray-700 hover:text-purple-700'
                            }`}
                        >
                            Home
                        </Link>
                        
                        {/* Hairstyle Dropdown */}
                        <div className="relative" ref={hairstyleDropdownRef}>
                            <button 
                                onClick={() => setIsHairstyleDropdownOpen(!isHairstyleDropdownOpen)}
                                className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                            >
                                Hairstyle
                                <svg 
                                    className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                        isHairstyleDropdownOpen ? 'rotate-180' : ''
                                    }`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isHairstyleDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-2">
                                        <Link
                                            href="/hairstyles-for-men"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsHairstyleDropdownOpen(false)}
                                        >
                                            Hairstyle for Men
                                        </Link>
                                        <Link
                                            href="/hairstyles-for-women"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsHairstyleDropdownOpen(false)}
                                        >
                                            Hairstyle for Women
                                        </Link>
                                        <Link
                                            href="/hairstyles-for-girls"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsHairstyleDropdownOpen(false)}
                                        >
                                            Hairstyles for Girls
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Hairstyle Filter Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                            >
                                Blog
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
                                            Buzz Cut
                                        </Link>
                                        <Link
                                            href="/bob-haircut-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Bob Haircut
                                        </Link>
                                        <Link
                                            href="/bangs-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Bangs
                                        </Link>
                                        <Link
                                            href="/ai-braids"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            AI Braids
                                        </Link>
                                        <Link
                                            href="/pixie-cut-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Pixie Cut
                                        </Link>
                                        <Link
                                            href="/short-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Short Hair
                                        </Link>
                                        <Link
                                            href="/long-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Long Hair
                                        </Link>
                                        <Link
                                            href="/dreadlocks"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Dreadlocks
                                        </Link>
                                        <Link
                                            href="/low-fade-haircut"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Low Fade Haircut
                                        </Link>
                                        <Link
                                            href="/pompadour"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Pompadour
                                        </Link>
                                        <Link
                                            href="/man-bun"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Man Bun
                                        </Link>
                                        <Link
                                            href="/undercut"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Undercut
                                        </Link>
                                        <Link
                                            href="/textured-fringe"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                                                                Textured Fringe
                                </Link>
                            </div>

                            {/* Mobile Other Tools Menu */}
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-gray-900 font-medium">Other Tools</div>
                                <Link
                                    href="/face-shape-detector"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Face Shape Detector
                                </Link>
                            </div>

                            <Link
                                href="/about"
                                className="block px-4 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                About
                            </Link>
                        </div>
                            )}
                        </div>
                        
                        {/* Other Tools Dropdown */}
                        <div className="relative" ref={otherToolsDropdownRef}>
                            <button 
                                onClick={() => setIsOtherToolsDropdownOpen(!isOtherToolsDropdownOpen)}
                                className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                            >
                                Other Tools
                                <svg 
                                    className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                        isOtherToolsDropdownOpen ? 'rotate-180' : ''
                                    }`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isOtherToolsDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-2">
                                        <Link
                                            href="/face-shape-detector"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsOtherToolsDropdownOpen(false)}
                                        >
                                            Face Shape Detector
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <Link href="/about" className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700">
                            About
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-700 hover:text-purple-700 p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                        <div className="px-4 py-2 space-y-1">
                            <Link 
                                href="/" 
                                className={`block px-4 py-2 rounded-lg ${
                                    pathname === '/' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Home
                            </Link>
                            
                            {/* Mobile Hairstyle Menu */}
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-gray-900 font-medium">Hairstyle</div>
                                <Link
                                    href="/hairstyles-for-men"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Hairstyle for Men
                                </Link>
                                <Link
                                    href="/hairstyles-for-women"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Hairstyle for Women
                                </Link>
                                <Link
                                    href="/hairstyles-for-girls"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Hairstyles for Girls
                                </Link>
                            </div>

                            {/* Mobile Blog Menu */}
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-gray-900 font-medium">Blog</div>
                                <Link
                                    href="/buzz-cut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Buzz Cut
                                </Link>
                                <Link
                                    href="/bob-haircut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Bob Haircut
                                </Link>
                                <Link
                                    href="/bangs-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Bangs
                                </Link>
                                <Link
                                    href="/ai-braids"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    AI Braids
                                </Link>
                                <Link
                                    href="/pixie-cut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Pixie Cut
                                </Link>
                                <Link
                                    href="/short-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Short Hair
                                </Link>
                                <Link
                                    href="/long-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Long Hair
                                </Link>
                                <Link
                                    href="/dreadlocks"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dreadlocks
                                </Link>
                                <Link
                                    href="/low-fade-haircut"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Low Fade Haircut
                                </Link>
                                <Link
                                    href="/pompadour"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Pompadour
                                </Link>
                                <Link
                                    href="/man-bun"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Man Bun
                                </Link>
                                <Link
                                    href="/undercut"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Undercut
                                </Link>
                                <Link
                                    href="/textured-fringe"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Textured Fringe
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
} 