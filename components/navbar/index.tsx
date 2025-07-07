"use client"

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs'


export default function Navbar() {
    const [isSticky, setIsSticky] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isHairstyleDropdownOpen, setIsHairstyleDropdownOpen] = useState(false);
    const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
    const [isOtherToolsDropdownOpen, setIsOtherToolsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userCredits, setUserCredits] = useState<number>(0);
    const { user } = useUser();
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hairstyleDropdownRef = useRef<HTMLDivElement>(null);
    const colorDropdownRef = useRef<HTMLDivElement>(null);
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

    // Fetch user credits when user is logged in
    useEffect(() => {
        const fetchUserCredits = async () => {
            if (user?.id) {
                try {
                    const response = await fetch(`/api/user-credits?userId=${user.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserCredits(data.balance || 0);
                        
                        // 如果积分被刷新了，显示提示
                        if (data.dailyRefreshed) {
                            // 使用简单的浏览器通知，而不是toast
                            console.log('Daily credits refreshed! You now have 50 credits.');
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch user credits:', error);
                }
            }
        };

        fetchUserCredits();
    }, [user]);

    // Click outside to close dropdown menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (hairstyleDropdownRef.current && !hairstyleDropdownRef.current.contains(event.target as Node)) {
                setIsHairstyleDropdownOpen(false);
            }
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
                setIsColorDropdownOpen(false);
            }
            if (otherToolsDropdownRef.current && !otherToolsDropdownRef.current.contains(event.target as Node)) {
                setIsOtherToolsDropdownOpen(false);
            }
        };

        if (isDropdownOpen || isHairstyleDropdownOpen || isColorDropdownOpen || isOtherToolsDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen, isHairstyleDropdownOpen, isColorDropdownOpen, isOtherToolsDropdownOpen]);

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
                        
                        
                        
                        {/* Hairstyle Filter Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                            >
                                Hairstyle Filter
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
                            href="/ai-braids-filter"
                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            Braids Filter
                        </Link>
                                        <Link
                                            href="/perm-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Perm Filter
                                        </Link>
                                        <Link
                                            href="/pixie-cut-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Pixie Cut Filter
                                        </Link>
                                        <Link
                                            href="/short-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Short Hair Filter
                                        </Link>
                                        <Link
                                            href="/long-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Long Hair Filter
                                        </Link>
                                                                <Link
                            href="/dreadlocks-filter"
                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            Dreadlocks Filter
                        </Link>
                                                                <Link
                            href="/low-fade-haircut-filter"
                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            Low Fade Haircut Filter
                        </Link>
                                                                <Link
                            href="/pompadour-filter"
                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            Pompadour Filter
                        </Link>
                                                                <Link
                            href="/man-bun-filter"
                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            Man Bun Filter
                        </Link>
                                                                <Link
                            href="/undercut-filter"
                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            Undercut Filter
                        </Link>
                                                                <Link
                            href="/textured-fringe-filter"
                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                           Textured Fringe Filter
                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Color Filter Dropdown */}
                        <div className="relative" ref={colorDropdownRef}>
                            <button 
                                onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                                className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700"
                            >
                                Color Filter
                                <svg 
                                    className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                                        isColorDropdownOpen ? 'rotate-180' : ''
                                    }`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isColorDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-2">
                                        <Link
                                            href="/ai-hair-color-changer"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsColorDropdownOpen(false)}
                                        >
                                            AI Hair Color Changer
                                        </Link>
                                        <Link
                                            href="/blonde-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsColorDropdownOpen(false)}
                                        >
                                            Blonde Hair Filter
                                        </Link>
                                        <Link
                                            href="/black-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsColorDropdownOpen(false)}
                                        >
                                            Black Hair Filter
                                        </Link>
                                        <Link
                                            href="/red-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsColorDropdownOpen(false)}
                                        >
                                            Red Hair Filter
                                        </Link>
                                        <Link
                                            href="/white-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsColorDropdownOpen(false)}
                                        >
                                            White Hair Filter
                                        </Link>
                                        <Link
                                            href="/gray-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsColorDropdownOpen(false)}
                                        >
                                            Gray Hair Filter
                                        </Link>
                                        <Link
                                            href="/pink-hair-filter"
                                            className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                            onClick={() => setIsColorDropdownOpen(false)}
                                        >
                                            Pink Hair Filter
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    
                        
                        <Link href="/about" className="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700">
                            About
                        </Link>
                        
                        {/* Auth Buttons */}
                        <SignedOut>
                            <SignInButton>
                            <button className="border border-purple-700 text-purple-700 hover:bg-purple-100 hover:text-purple-900 rounded-full font-medium text-sm h-8 px-4 cursor-pointer transition-colors">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton>
                                <button className="bg-purple-700 text-white rounded-full font-medium text-sm h-8 px-4 cursor-pointer hover:bg-purple-900 transition-colors">
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <div className="flex items-center space-x-3">
                                {user?.publicMetadata?.membership === 'monthly' || user?.publicMetadata?.membership === 'yearly' ? (
                                    <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        ✨ PRO
                                    </div>
                                ) : (
                                    <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                        💎 {userCredits} credits
                                    </div>
                                )}
                                <UserButton />
                            </div>
                        </SignedIn>
                
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
                            
                            {/* Mobile Hairstyle Filter Menu */}
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-gray-900 font-medium">Hairstyle Filter</div>
                                <Link
                                    href="/buzz-cut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Buzz Cut Filter
                                </Link>
                                <Link
                                    href="/bob-haircut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Bob Haircut Filter
                                </Link>
                                <Link
                                    href="/bangs-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Bangs Filter
                                </Link>
                                <Link
                                    href="/ai-braids-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Braids Filter
                                </Link>
                                <Link
                                    href="/pixie-cut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Pixie Cut Filter
                                </Link>
                                <Link
                                    href="/short-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Short Hair Filter
                                </Link>
                                <Link
                                    href="/long-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Long Hair Filter
                                </Link>
                                <Link
                                    href="/dreadlocks-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dreadlocks Filter
                                </Link>
                                <Link
                                    href="/low-fade-haircut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Low Fade Haircut Filter
                                </Link>
                                <Link
                                    href="/pompadour-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Pompadour Filter
                                </Link>
                                <Link
                                    href="/man-bun-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Man Bun Filter
                                </Link>
                                <Link
                                    href="/perm-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Perm Filter
                                </Link>
                                <Link
                                    href="/undercut-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Undercut Filter
                                </Link>
                                <Link
                                    href="/textured-fringe-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Textured Fringe Filter
                                </Link>
                            </div>

                            {/* Mobile Color Filter Menu */}
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-gray-900 font-medium">Color Filter</div>
                                <Link
                                    href="/ai-hair-color-changer"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    AI Hair Color Changer
                                </Link>
                                <Link
                                    href="/blonde-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Blonde Hair Filter
                                </Link>
                                <Link
                                    href="/black-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Black Hair Filter
                                </Link>
                                <Link
                                    href="/red-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Red Hair Filter
                                </Link>
                                <Link
                                    href="/white-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    White Hair Filter
                                </Link>
                                <Link
                                    href="/gray-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Gray Hair Filter
                                </Link>
                                <Link
                                    href="/pink-hair-filter"
                                    className="block px-6 py-2 text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Pink Hair Filter
                                </Link>
                            </div>
                            
                            {/* Mobile Auth Buttons */}
                            <div className="px-4 py-2 space-y-2">
                                <SignedOut>
                                    <SignInButton>
                                    <button className="border border-[#6c47ff] text-[#6c47ff] hover:bg-[#6c47ff] hover:text-white rounded-full font-medium text-sm h-8 px-4 cursor-pointer transition-colors">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton>
                                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm h-8 px-4 cursor-pointer hover:bg-[#5a3de6] transition-colors">
                                    Sign Up
                                </button>
                                    </SignUpButton>
                                </SignedOut>
                                <SignedIn>
                                    <div className="flex items-center justify-between px-4 py-2">
                                        <div className="flex items-center space-x-3">
                                            <UserButton />
                                            <span className="text-gray-700">Profile</span>
                                        </div>
                                        {user?.publicMetadata?.membership === 'monthly' || user?.publicMetadata?.membership === 'yearly' ? (
                                            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                ✨ PRO
                                            </div>
                                        ) : (
                                            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                                💎 {userCredits} credits
                                            </div>
                                        )}
                                    </div>
                                </SignedIn>
                            </div>
                     
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
} 