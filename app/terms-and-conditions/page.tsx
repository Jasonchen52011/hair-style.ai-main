import { Metadata } from 'next'
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

// 添加 metadata 配置
export const metadata: Metadata = {
    metadataBase: new URL('https://hair-style.ai'),
    title: 'Terms & Conditions | Hair-style.ai',
    description: 'Read our terms and conditions to understand the rules, guidelines, and legal agreements for using Hair-style.ai services.',
    alternates: {
        canonical: 'https://hair-style.ai/terms-and-conditions',
    },
    openGraph: {
        title: 'Terms & Conditions | Hair-style.ai',
        description: 'Read our terms and conditions to understand the rules, guidelines, and legal agreements for using Hair-style.ai services.',
        url: 'https://hair-style.ai/terms-and-conditions',
        siteName: 'Hair-style.ai',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'Terms & Conditions | Hair-style.ai',
        description: 'Read our terms and conditions to understand the rules, guidelines, and legal agreements for using Hair-style.ai services.',
    },
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
          
          <p className="mb-8 text-gray-600">
            Please read these Terms and Conditions carefully before using our Service.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Interpretation</h2>
            <p className="mb-4 text-gray-600">Words with capitalized initial letters have meanings defined in the following conditions. Definitions apply regardless of whether they are singular or plural.</p>
            
            <h3 className="text-xl font-medium mb-3">1.2. Definitions</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Country: United States</li>
              <li>Company: Refers to Hair-style.ai, located at hair-style.ai</li>
              <li>Device: Any device capable of accessing the Service, such as a computer, cellphone, or digital tablet</li>
              <li>Service: Refers to the Hair-style.ai website</li>
              <li>Terms and Conditions: These Terms and Conditions, which form the entire agreement between You and the Company regarding the use of the Service</li>
              <li>Third-Party Social Media Service: Any services or content provided by a third-party that may be displayed, included, or made available by the Service</li>
              <li>Website: Refers to Hair-style.ai, accessible from hair-style.ai</li>
              <li>You: The individual accessing or using the Service, or the company or other legal entity on behalf of which such individual is accessing or using the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Acknowledgment</h2>
            <p className="text-gray-600">
              These Terms and Conditions govern the use of our Service and represent the agreement between You and the Company. 
              By accessing or using the Service, You agree to be bound by these Terms and Conditions. If You disagree with any 
              part of these Terms and Conditions, You may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Use License</h2>
            <p className="mb-4 text-gray-600">
              Permission is granted to temporarily download one copy of the materials (information or software) on the Hair-style.ai 
              website for personal, non-commercial transitory viewing only. This license does not include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or public display (commercial or non-commercial)</li>
              <li>Attempting to decompile or reverse engineer any software on the Hair-style.ai website</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or mirroring the materials on any other server</li>
            </ul>
          </section>

          {/* 添加更多部分，包括：
          4. Disclaimer
          5. Limitations
          6. Accuracy of Materials
          7. Links
          8. Modifications
          9. Governing Law
          10. Termination
          11. Limitation of Liability
          12. "AS IS" and "AS AVAILABLE" Disclaimer
          13. Severability and Waiver
          14. Translation Interpretation
          15. Changes to These Terms and Conditions */}

          <div className="text-sm text-gray-500 mt-16">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>Hair-style.ai - AI Powered Hairstyle Transformation</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 