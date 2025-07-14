import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { Metadata } from 'next'

// Privacy Policy 页面 metadata
export const metadata: Metadata = {
    metadataBase: new URL('https://hair-style.ai'),
    alternates: {
        canonical: 'https://hair-style.ai/privacy-policy',
    },
    title: 'Privacy Policy - Hair-style.ai',
    description: 'Learn how Hair-style.ai protects your privacy and personal data. Our comprehensive privacy policy explains our data collection, usage, security measures.',
    keywords: [
        'privacy policy',
        'data protection',
        'user privacy',
        'data security',
        'hair-style.ai privacy'
    ],
    openGraph: {
        title: 'Privacy Policy - Hair-style.ai',
        url: 'https://hair-style.ai/privacy-policy',
        siteName: 'Hair-style.ai',
        type: 'website',
        images: [
            {
                url: 'https://hair-style.ai/images/hero/ba3.jpg',
                width: 1200,
                height: 630,
                alt: 'Hair-style.ai transformation example',
                type: 'image/jpeg',
            }
        ],
    }
}

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-grow">
                <div className="container mx-auto px-4 py-16 max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        <strong>Effective Date:</strong> {new Date().toLocaleDateString()}<br />
                        <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                    </p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                        <p className="text-gray-600 mb-4">
                            Welcome to Hair-style.ai ("we," "our," or "us"). We are committed to protecting your privacy and personal information. 
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
                            at hair-style.ai and use our AI-powered hairstyle transformation services.
                        </p>
                        <p className="text-gray-600 mb-4">
                            By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. 
                            If you do not agree with our policies and practices, do not use our Service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                        
                        <h3 className="text-xl font-semibold mb-3">2.1 Personal Information</h3>
                        <p className="text-gray-600 mb-4">We may collect the following personal information:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                            <li><strong>Account Information:</strong> When you create an account, we collect your email address, username, and password (encrypted)</li>
                            <li><strong>Profile Information:</strong> Name, profile picture, preferences, and settings</li>
                            <li><strong>Contact Information:</strong> Email address for communications and support</li>
                            <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely by our payment providers)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3">2.2 Image Data</h3>
                        <p className="text-gray-600 mb-4">
                            <strong>Uploaded Photos:</strong> When you use our AI hairstyle transformation service, you upload photos of yourself. 
                            These images are processed by our AI system to generate hairstyle previews. We temporarily store these images to provide our service. After you close the browser, these images will be deleted.
                        </p>

                        <h3 className="text-xl font-semibold mb-3">2.3 Usage Information</h3>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                            <li>Service usage statistics and preferences</li>
                            <li>Device information (browser type, operating system, device ID)</li>
                            <li>IP address and location data (for security and analytics)</li>
                            <li>Cookies and similar tracking technologies</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3">2.4 Transaction Information</h3>
                        <p className="text-gray-600 mb-4">
                            When you make purchases, we collect transaction details including purchase amount, date, 
                            subscription status, and payment confirmations.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">We use your information for the following purposes:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Service Provision:</strong> To provide and maintain our AI hairstyle transformation service</li>
                            <li><strong>Account Management:</strong> To create and manage your user account and preferences</li>
                            <li><strong>Payment Processing:</strong> To process transactions and manage subscriptions</li>
                            <li><strong>AI Processing:</strong> To analyze uploaded images and generate hairstyle transformations</li>
                            <li><strong>Communication:</strong> To send service updates, security alerts, and customer support</li>
                            <li><strong>Improvement:</strong> To analyze usage patterns and improve our AI algorithms and user experience</li>
                            <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
                            <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
                        <p className="text-gray-600 mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>
                        
                        <h3 className="text-xl font-semibold mb-3">4.1 Service Providers</h3>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                            <li><strong>Payment Processors:</strong> To process payments and manage subscriptions</li>
                            <li><strong>Cloud Storage:</strong> To securely store and process your data</li>
                            <li><strong>AI Processing:</strong> To provide AI transformation services</li>
                            <li><strong>Analytics:</strong> To understand service usage and improve functionality</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3">4.2 Legal Requirements</h3>
                        <p className="text-gray-600 mb-4">
                            We may disclose your information if required by law, court order, or government regulation, 
                            or to protect our rights, property, or safety, or that of others.
                        </p>

                        <h3 className="text-xl font-semibold mb-3">4.3 Business Transfers</h3>
                        <p className="text-gray-600 mb-4">
                            In the event of a merger, acquisition, or sale of assets, your information may be transferred 
                            as part of the transaction, subject to the same privacy protections.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                        <p className="text-gray-600 mb-4">We implement comprehensive security measures to protect your personal information:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Encryption:</strong> All data transmission and storage is encrypted using industry-standard protocols</li>
                            <li><strong>Access Controls:</strong> Strict access controls and authentication for our systems</li>
                            <li><strong>Regular Audits:</strong> Regular security assessments and vulnerability testing</li>
                            <li><strong>Secure Infrastructure:</strong> Use of secure cloud infrastructure with robust security measures</li>
                            <li><strong>Employee Training:</strong> Regular privacy and security training for our staff</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            However, no method of transmission over the internet or electronic storage is 100% secure. 
                            While we strive to protect your personal information, we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
                        <p className="text-gray-600 mb-4">We retain your information for different periods depending on the type of data:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Account Information:</strong> Retained until account deletion or 3 years of inactivity</li>
                            <li><strong>Uploaded Images:</strong> Temporarily stored for processing (typically 24-48 hours), then automatically deleted</li>
                            <li><strong>Generated Results:</strong> Stored in your account until you delete them or close your account</li>
                            <li><strong>Transaction Records:</strong> Retained for 7 years for accounting and legal compliance</li>
                            <li><strong>Usage Analytics:</strong> Anonymized data may be retained indefinitely for service improvement</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">7. Your Privacy Rights</h2>
                        <p className="text-gray-600 mb-4">You have the following rights regarding your personal information:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Access:</strong> Request access to your personal information we hold</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                            <li><strong>Portability:</strong> Request a copy of your data in a commonly used format</li>
                            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                            <li><strong>Account Deletion:</strong> Delete your account and associated data through your account settings</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            To exercise these rights, please contact us at hello@hair-style.ai. We will respond to your request within 30 days.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking Technologies</h2>
                        <p className="text-gray-600 mb-4">We use cookies and similar technologies to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Maintain your login session and preferences</li>
                            <li>Analyze website usage and performance</li>
                            <li>Provide personalized content and recommendations</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                        <p className="text-gray-600 mt-4">
                            You can control cookies through your browser settings. However, disabling cookies may affect 
                            your ability to use certain features of our Service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
                        <p className="text-gray-600 mb-4">
                            Your information may be transferred to and processed in countries other than your own. 
                            We ensure that all transfers comply with applicable data protection laws and implement 
                            appropriate safeguards to protect your information.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
                        <p className="text-gray-600 mb-4">
                            Our Service is not intended for children under 16 years of age. We do not knowingly collect 
                            personal information from children under 16. If you are a parent or guardian and believe your 
                            child has provided us with personal information, please contact us immediately.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">11. Third-Party Links and Services</h2>
                        <p className="text-gray-600 mb-4">
                            Our Service may contain links to third-party websites or services. This Privacy Policy does not 
                            apply to those third-party services. We encourage you to review the privacy policies of any 
                            third-party services you visit.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">12. Changes to This Privacy Policy</h2>
                        <p className="text-gray-600 mb-4">
                            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. 
                            We will notify you of any material changes by posting the new Privacy Policy on this page and updating the 
                            "Last Updated" date. For significant changes, we may also send you an email notification.
                        </p>
                        <p className="text-gray-600 mb-4">
                            Your continued use of our Service after any changes indicates your acceptance of the updated Privacy Policy.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
                        <p className="text-gray-600 mb-4">
                            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                            please contact us:
                        </p>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <ul className="space-y-2 text-gray-600">
                                <li><strong>Email:</strong> hello@hair-style.ai</li>
                                <li><strong>Website:</strong> <a href="https://hair-style.ai" className="text-blue-600 hover:underline">hair-style.ai</a></li>
                                <li><strong>Subject Line:</strong> Privacy Policy Inquiry</li>
                            </ul>
                        </div>
                    </section>

                    <div className="border-t pt-8 text-sm text-gray-500">
                        <p className="mb-2"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
                        <p>© 2024 Hair-style.ai - AI Powered Hairstyle Transformation. All rights reserved.</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
} 