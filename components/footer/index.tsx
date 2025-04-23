"use client"

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-black text-white py-16">
            <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
                    {/* Column 1 - Logo and Description */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
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
                            Free AI Hairstyle Changer,discover your perfect look! Choose from over 56 hairstyles, including bob, wavy curls, buzz cut, bald, slicked back, braids, and more.
                        </p>
                    </div>

                    {/* Column 2 - Company Links */}
                    <div>
                        <h3 className="text-xl font-semibold mb-6">Company</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3 - Connect */}
                    <div>
                        <h3 className="text-xl font-semibold mb-6">Connect With Us</h3>
                        <div className="space-y-4">
                            <a 
                                href="mailto:hello@hair-style.ai"
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
    