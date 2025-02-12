"use client"

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Product */}
                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/pricing" className="text-gray-600 hover:text-purple-700">
                                    Pricing
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-gray-600 hover:text-purple-700">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-and-conditions" className="text-gray-600 hover:text-purple-700">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="text-gray-600 hover:text-purple-700">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Follow Us */}
                    <div>
                        <h3 className="font-semibold mb-4">Follow Us</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="https://x.com/hair_styleai" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-700">
                                    Twitter
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-center text-gray-600">
                        © Copyright {new Date().getFullYear()}. All Rights Reserved. Hair-style.ai
                    </p>
                </div>
            </div>
        </footer>
    );
}
    