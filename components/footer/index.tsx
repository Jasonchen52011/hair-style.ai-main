"use client"

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-black text-white py-16">
            <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12">
                    {/* Column 1 - Logo and Description */}
                    <div className="space-y-6 text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <div className="relative w-8 h-8">
                            <Image
                                src="/images/logo/favicon.ico"
                                alt="Hairstyle.ai Logo"
                                width={32}
                                height={32}
                                className="mr-2"
                                priority
                            />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Hairstyle AI</h3>
                        </div>
                        <p className="text-gray-400 text-lg">
                            Hairstyle AI is a free online hairstyle simulator that lets you try 60+ haircuts and colors on your photo in seconds.
                        </p>
                    </div>

                    {/* Column 2 - Hairstyle */}
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-semibold mb-6">Hairstyle</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/hairstyles-for-men" className="text-gray-400 hover:text-white transition-colors">
                                    Hairstyle Simulator for Male
                                </Link>
                            </li>
                            <li>
                                <Link href="/hairstyles-for-women" className="text-gray-400 hover:text-white transition-colors">
                                    Hairstyle Simulator for Female
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3 - Blog */}
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-semibold mb-6">Blog</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/buzz-cut-filter" className="text-gray-400 hover:text-white transition-colors">
                                    Buzz Cut
                                </Link>
                            </li>
                            <li>
                                <Link href="/bob-haircut-filter" className="text-gray-400 hover:text-white transition-colors">
                                    Bob Haircut
                                </Link>
                            </li>
                            <li>
                                <Link href="/bangs-filter" className="text-gray-400 hover:text-white transition-colors">
                                    Bangs
                                </Link>
                            </li>
                            <li>
                                <Link href="/ai-braids" className="text-gray-400 hover:text-white transition-colors">
                                    AI Braids
                                </Link>
                            </li>
                            <li>
                                <Link href="/pixie-cut-filter" className="text-gray-400 hover:text-white transition-colors">
                                    Pixie Cut
                                </Link>
                            </li>
                            <li>
                                <Link href="/short-hair-filter" className="text-gray-400 hover:text-white transition-colors">
                                    Short Hair
                                </Link>
                            </li>
                            <li>
                                <Link href="/long-hair-filter" className="text-gray-400 hover:text-white transition-colors">
                                    Long Hair
                                </Link>
                            </li>
                            <li>
                                <Link href="/dreadlocks" className="text-gray-400 hover:text-white transition-colors">
                                    Dreadlocks
                                </Link>
                            </li>
                            <li>
                                <Link href="/low-fade-haircut" className="text-gray-400 hover:text-white transition-colors">
                                    Low Fade Haircut
                                </Link>
                            </li>
                            <li>
                                <Link href="/pompadour" className="text-gray-400 hover:text-white transition-colors">
                                    Pompadour
                                </Link>
                            </li>
                            <li>
                                <Link href="/man-bun" className="text-gray-400 hover:text-white transition-colors">
                                    Man Bun
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4 - Company Links */}
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-semibold mb-6">Company</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">
                                    Terms and Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 5 - Connect */}
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-semibold mb-6">Connect With Us</h3>
                        <div className="space-y-4">
                            <a 
                                href="mailto:hello@hair-style.ai"
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors justify-center md:justify-start"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                                hello@hair-style.ai
                            </a>
                            <a 
                                href="https://twitter.com/hairstyleai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors justify-center md:justify-start"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                Twitter
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
    