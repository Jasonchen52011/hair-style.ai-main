"use client"

import Link from 'next/link';

function Footer() {
    return (
        <footer className="bg-black">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {/* Logo Section */}
                    <div className="col-span-1">
                        <Link href="/" className="inline-block mb-6">
                            <span className="text-2xl font-bold text-white">Hair-style.ai</span>
                        </Link>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/ai-hairstyle" className="text-gray-400 hover:text-white">
                                    Try AI Hairstyle
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="text-gray-400 hover:text-white">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-white">
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Follow Us */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Follow Us</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    Facebook
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    Pinterest
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    Twitter
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    TikTok
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 text-center">
                    <p className="text-gray-400">
                        © Copyright {new Date().getFullYear()}. All Rights Reserved.{' '}
                        <Link href="/" className="hover:text-white">
                            Hair-style.ai
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
    