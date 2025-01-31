import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://hair-style.ai'),
  alternates: {
    canonical: 'https://hair-style.ai/privacy-policy',
  },
  title: 'Privacy Policy | Hair-style.ai',
  description: 'Read our privacy policy to understand how we protect your data and respect your privacy at Hair-style.ai.'
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">Information We Collect</h2>
            <p className="text-lg text-gray-600 mb-4">
              We collect information that you provide directly to us when using our services.
            </p>
            {/* Add more content... */}
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-lg text-gray-600 space-y-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              {/* Add more list items... */}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
} 