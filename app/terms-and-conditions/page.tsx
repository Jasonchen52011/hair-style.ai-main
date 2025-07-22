import { Metadata } from 'next'
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

// Terms & Conditions 页面 metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://hair-style.ai'),
  alternates: {
      canonical: 'https://hair-style.ai/terms-and-conditions',
  },
  title: 'Terms & Conditions - Hair-style.ai',
  description: 'Read our terms and conditions to understand your rights and responsibilities when using Hair-style.ai. Learn about our service guidelines and user agreements.',
  keywords: [
      'user agreement',
      'service terms',
      'legal terms',
      'usage terms',
      'terms of service',
      'hairstyle.ai terms'
  ],
  openGraph: {
      title: 'Terms & Conditions - Hair-style.ai',
      url: 'https://hair-style.ai/terms-and-conditions',
      siteName: 'Hair-style.ai',
      type: 'website',
      images: [
          {
              url: '/images/hero/ba3.jpg',
              width: 1200,
              height: 630,
              alt: 'Hairstyle.ai transformation example',
              type: 'image/jpeg',
          }
      ],
  }
} 

export default function TermsAndConditions() {
  // 添加结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms & Conditions',
    description: 'Terms and conditions for using Hair-style.ai services',
    publisher: {
      '@type': 'Organization',
      name: 'Hair-style.ai',
      url: 'https://hair-style.ai'
    },
    inLanguage: 'en',
    url: 'https://hair-style.ai/terms-and-conditions',
    mainEntity: {
      '@type': 'WebContent',
      about: {
        '@type': 'Thing',
        name: 'Terms and Conditions',
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
          
          <p className="text-gray-600 mb-8 text-lg">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString()}<br />
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <p className="mb-8 text-gray-600">
            Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using 
            the Hair-style.ai website and service (the "Service") operated by Hair-style.ai ("us", "we", or "our").
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using our Service, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
            <p className="text-gray-600 mb-4">
              Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. 
              These Terms apply to all visitors, users and others who access or use the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
            <p className="text-gray-600 mb-4">For the purposes of these Terms and Conditions:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>"Service"</strong> refers to the Hair-style.ai website and AI hairstyle transformation service</li>
              <li><strong>"User", "You"</strong> refers to the individual accessing or using the Service</li>
              <li><strong>"Company", "we", "us", "our"</strong> refers to Hair-style.ai</li>
              <li><strong>"Account"</strong> means a unique account created for You to access our Service</li>
              <li><strong>"Content"</strong> refers to content such as text, images, or other information that can be posted, uploaded, linked to or otherwise made available by You</li>
              <li><strong>"Third-party Services"</strong> means any services or content provided by a third-party</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for safeguarding your account credentials</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You are responsible for all activities that occur under your account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 Account Eligibility</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>You must be at least 16 years old to create an account</li>
              <li>Users under 18 must have parental consent</li>
              <li>You must not create multiple accounts for the same individual</li>
              <li>Corporate accounts must be created by authorized representatives</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Account Termination</h3>
            <p className="text-gray-600 mb-4">
              We reserve the right to terminate or suspend accounts that violate these Terms, 
              engage in fraudulent activity, or misuse our Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Service Description</h2>
            <p className="text-gray-600 mb-4">
              Hair-style.ai provides an AI-powered hairstyle transformation service that allows users to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Upload personal photos for hairstyle simulation</li>
              <li>Generate AI-powered hairstyle transformations</li>
              <li>Preview different hair colors and styles</li>
              <li>Save and download transformation results</li>
              <li>Access premium features with paid subscriptions</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Our Service is provided on an "as is" basis. We do not guarantee that the AI transformations 
              will be perfectly accurate or suitable for all users.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-semibold mb-3">5.1 Permitted Use</h3>
            <p className="text-gray-600 mb-4">You may use our Service for personal, non-commercial purposes only, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Experimenting with different hairstyles for personal reference</li>
              <li>Sharing results with friends and family</li>
              <li>Using results for personal styling decisions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.2 Prohibited Use</h3>
            <p className="text-gray-600 mb-4">You agree NOT to use our Service for:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Uploading inappropriate, offensive, or illegal content</li>
              <li>Creating fake profiles or impersonating others</li>
              <li>Commercial use without proper licensing</li>
              <li>Reverse engineering or attempting to extract our AI algorithms</li>
              <li>Uploading photos of minors without parental consent</li>
              <li>Violating intellectual property rights</li>
              <li>Distributing malware or harmful code</li>
              <li>Automated scraping or data harvesting</li>
              <li>Creating competing services using our technology</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. User Content and Privacy</h2>
            
            <h3 className="text-xl font-semibold mb-3">6.1 Content Ownership</h3>
            <p className="text-gray-600 mb-4">
              You retain ownership of any photos you upload. However, by using our Service, you grant us a 
              limited license to process your images for the purpose of providing hairstyle transformations.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.2 Content Guidelines</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Only upload photos you have the right to use</li>
              <li>Ensure uploaded content complies with applicable laws</li>
              <li>Do not upload photos containing multiple people</li>
              <li>Photos should clearly show the face and hair</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">6.3 Content Processing</h3>
            <p className="text-gray-600 mb-4">
              Uploaded images are temporarily processed by our AI system and automatically deleted within 48 hours. 
              Generated results are saved to your account and can be deleted at any time.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. Payment Terms and Subscriptions</h2>
            
            <h3 className="text-xl font-semibold mb-3">7.1 Pricing</h3>
            <p className="text-gray-600 mb-4">
              Our Service offers both free and paid tiers. Current pricing is displayed on our website and may be updated at any time.
            </p>

            <h3 className="text-xl font-semibold mb-3">7.2 Payment Processing</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Payments are processed securely through third-party payment providers</li>
              <li>All charges are in USD unless otherwise specified</li>
              <li>You authorize us to charge your payment method for applicable fees</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.3 Subscriptions</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>You can cancel subscriptions through your account settings</li>
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>No refunds for partial subscription periods</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.4 Refund Policy</h3>
            <p className="text-gray-600 mb-4">
              Refunds are generally not provided for digital services. However, we may provide refunds at our discretion 
              for technical issues or service failures. Contact our support team for refund requests.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">8. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-semibold mb-3">8.1 Our Intellectual Property</h3>
            <p className="text-gray-600 mb-4">
              The Service, including its original content, features, and functionality, is owned by Hair-style.ai and is 
              protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.2 Generated Content</h3>
            <p className="text-gray-600 mb-4">
              AI-generated hairstyle transformations created using our Service are provided for your personal use. 
              Commercial use requires appropriate licensing.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.3 Trademark Policy</h3>
            <p className="text-gray-600 mb-4">
              Hair-style.ai and associated logos are trademarks of our company. You may not use our trademarks 
              without prior written permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">9. Disclaimers and Limitations</h2>
            
            <h3 className="text-xl font-semibold mb-3">9.1 Service Availability</h3>
            <p className="text-gray-600 mb-4">
              We strive to maintain service availability but do not guarantee uninterrupted access. 
              The Service may be temporarily unavailable for maintenance, updates, or technical issues.
            </p>

            <h3 className="text-xl font-semibold mb-3">9.2 AI Accuracy</h3>
            <p className="text-gray-600 mb-4">
              AI-generated results are simulations and may not accurately represent how a hairstyle would 
              look in reality. Results should be used for reference only.
            </p>

            <h3 className="text-xl font-semibold mb-3">9.3 Third-Party Services</h3>
            <p className="text-gray-600 mb-4">
              We are not responsible for the content, privacy policies, or practices of third-party services 
              that may be linked to or integrated with our Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              To the maximum extent permitted by applicable law, in no event shall Hair-style.ai, its affiliates, 
              directors, employees, or agents be liable for any indirect, incidental, special, consequential, or 
              punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
            <p className="text-gray-600 mb-4">
              Our total liability to you for any damages arising from or related to these Terms or your use of the Service 
              shall not exceed the amount you have paid us in the twelve months preceding the event giving rise to liability.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">11. Indemnification</h2>
            <p className="text-gray-600 mb-4">
              You agree to defend, indemnify, and hold harmless Hair-style.ai from and against any and all claims, 
              damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) 
              arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">12. Termination</h2>
            
            <h3 className="text-xl font-semibold mb-3">12.1 Termination by You</h3>
            <p className="text-gray-600 mb-4">
              You may terminate your account at any time through your account settings or by contacting our support team.
            </p>

            <h3 className="text-xl font-semibold mb-3">12.2 Termination by Us</h3>
            <p className="text-gray-600 mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, 
              including if you breach these Terms.
            </p>

            <h3 className="text-xl font-semibold mb-3">12.3 Effect of Termination</h3>
            <p className="text-gray-600 mb-4">
              Upon termination, your right to use the Service will cease immediately. Your account data will be deleted 
              in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">13. Governing Law and Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold mb-3">13.1 Governing Law</h3>
            <p className="text-gray-600 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States, 
              without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold mb-3">13.2 Dispute Resolution</h3>
            <p className="text-gray-600 mb-4">
              Any disputes arising from these Terms or your use of the Service will be resolved through binding arbitration 
              in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">14. Severability</h2>
            <p className="text-gray-600 mb-4">
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed 
              and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, 
              and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">15. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, 
              we will try to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
            <p className="text-gray-600 mb-4">
              Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">16. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ul className="space-y-2 text-gray-600">
                <li><strong>Company:</strong> Edurance Technology Limited</li>
                <li><strong>Registration Number:</strong> 76974526</li>
                <li><strong>Address:</strong> UNIT 1904, 19/F PODIUM PLAZA, 5 HANOI RD TST, HONG KONG</li>
                <li><strong>Email:</strong> hello@hair-style.ai</li>
                <li><strong>Website:</strong> <a href="https://hair-style.ai" className="text-blue-600 hover:underline">hair-style.ai</a></li>
                <li><strong>Subject Line:</strong> Terms and Conditions Inquiry</li>
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