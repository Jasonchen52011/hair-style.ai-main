"use client"

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-black text-white py-12">
            <div className="container mx-auto px-4">
                {/* Logo 部分 */}
                <div className="mb-8 text-center md:text-left">
                    <h2 className="text-2xl font-bold">Hair-style.ai</h2>
                </div>

                {/* 链接区域 - 使用网格布局 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
                    {/* 产品部分 */}
                    <div className="text-center sm:text-left">
                        <h3 className="text-lg font-semibold mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/ai-hairstyle" className="text-gray-400 hover:text-white transition-colors">
                                    Try AI Hairstyle
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 公司部分 */}
                    <div className="text-center sm:text-left">
                        <h3 className="text-lg font-semibold mb-4">Company</h3>
                        <ul className="space-y-3">
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
                                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 社交媒体部分 */}
                    <div className="text-center sm:text-left">
                        <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                                   className="text-gray-400 hover:text-white transition-colors">
                                    Facebook
                                </a>
                            </li>
                            <li>
                                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer"
                                   className="text-gray-400 hover:text-white transition-colors">
                                    Pinterest
                                </a>
                            </li>
                            <li>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                   className="text-gray-400 hover:text-white transition-colors">
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                                   className="text-gray-400 hover:text-white transition-colors">
                                    Twitter
                                </a>
                            </li>
                            <li>
                                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                                   className="text-gray-400 hover:text-white transition-colors">
                                    TikTok
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 版权信息 */}
                <div className="text-center text-gray-400 text-sm pt-8 border-t border-gray-800">
                    <p>© {new Date().getFullYear()} Hair-style.ai. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
    