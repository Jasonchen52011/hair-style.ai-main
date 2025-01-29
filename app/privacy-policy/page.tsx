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
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-gray-600 mb-4">
                    At hair-style.ai, your privacy is important to us. This Privacy Policy outlines the types of personal information 
                    we receive and collect when you use our website (hair-style.ai) and how we safeguard that information. By using our site, 
                    you consent to the data practices described in this policy.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3">Personal Information:</h3>
                <p className="text-gray-600 mb-4">
                    We may collect personal information that you provide directly, such as your name and email address, 
                    when you subscribe to our newsletter, fill out a form, or interact with our site.
                </p>

                <h3 className="text-xl font-semibold mb-3">Non-Personal Information:</h3>
                <p className="text-gray-600 mb-4">
                    We collect non-personal information about you whenever you interact with our site. This may include 
                    your browser name, type of computer, and technical information about your method of connecting to our site.
                </p>

                <h3 className="text-xl font-semibold mb-3">Cookies and Tracking Technologies:</h3>
                <p className="text-gray-600 mb-4">
                    We use cookies and similar tracking technologies to enhance your experience on our site. Cookies are 
                    small text files placed on your device that help us identify and track visitors and their usage of our site.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-600 mb-4">Our mission is to provide an exceptional and inspiring hairstyle experience through our innovative AI tool and extensive resources.</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                    <li>Personalized Experience: Generate unique hairstyle previews based on your photos.</li>
                    <li>Service Improvement: Analyze usage patterns to enhance our AI technology and user experience.</li>
                    <li>Communication: Send important updates about our service and respond to your inquiries.</li>
                    <li>Security: Protect our services and users from fraud and abuse.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
                <p className="text-gray-600 mb-4">
                    We implement reasonable security measures to protect your personal information. However, no method of 
                    transmission over the internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">5. Children's Privacy</h2>
                <p className="text-gray-600 mb-4">
                    Our website is not directed to children under the age of 16. If you are under 16, please do not provide 
                    any personal information to us without parental consent.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">6. Changes to This Policy</h2>
                <p className="text-gray-600 mb-4">
                    We may update this Privacy Policy from time to time. Any changes will be posted on this page with an 
                    updated effective date. We encourage you to periodically review this policy to stay informed about how 
                    we are protecting your information.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">7. Contact Information</h2>
                <p className="text-gray-600 mb-4">
                    If you have any questions about this Privacy Policy or our practices at hair-style.ai, please contact us at:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                    <li>Website: <a href="https://hair-style.ai" className="text-blue-600 hover:underline">hair-style.ai</a></li>
                    <li>Email: support@hair-style.ai</li>
                </ul>
            </section>

            <div className="text-sm text-gray-500 mt-16">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>hair-style.ai - AI Powered Hairstyle Transformation</p>
            </div>
        </div>
    );
} 