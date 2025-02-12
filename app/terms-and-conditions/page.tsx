import { Metadata } from 'next'
import Navbar from '@/components/navbar';

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
    <div className="min-h-screen">
      <Navbar />
      {/* 添加结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Interpretation</h2>
          <p className="mb-4">Words with capitalized initial letters have meanings defined in the following conditions. Definitions apply regardless of whether they are singular or plural.</p>
          
          <h3 className="text-xl font-medium mb-3">1.2. Definitions</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Country: United States</li>
            <li>Company: Refers to Hair-style.ai, located at hair-style.ai</li>
            <li>Device: Any device capable of accessing the Service, such as a computer, cellphone, or digital tablet</li>
            <li>Service: Refers to the Hair-style.ai website</li>
            <li>Website: Refers to Hair-style.ai, accessible from hair-style.ai</li>
            <li>You: The individual accessing or using the Service</li>
          </ul>
        </section>

        {/* Add more sections following the same pattern */}
      </div>
    </div>
  );
} 