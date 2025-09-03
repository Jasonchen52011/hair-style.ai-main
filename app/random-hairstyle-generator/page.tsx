import { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import RandomHairstyleGenerator from "./tool-page";
import HairstyleSelector from "@/components/HairstyleSelector";
import HowToUseSection from "@/components/HowToUseSection";
import UsageScenariosSection from "@/components/UsageScenariosSection";
import WhyChooseSection from "@/components/WhyChooseSection";
import FAQ from "@/components/faq";
import CTASection from "@/components/CTASection";
import config from "./config.json";

export const metadata: Metadata = {
  title: config.metadata.title,
  description: config.metadata.description,
  keywords: config.metadata.keywords,
  openGraph: {
    title: "Random Hairstyle Generator Online - AI-powered & Free",
    description: "Use our Random Hairstyle Generator AI tool to explore new hairstyles. Get personalized recommendations based on your face shape and style preferences.",
    images: [
      {
        url: "https://hair-style.ai/images/screenshots/random-hairstyle-generator-how-to.webp",
        width: 1200,
        height: 630,
        alt: "Random Hairstyle Generator Online",
      },
    ],
  },
};

export default function RandomHairstyleGeneratorPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Generator Tool - Contains the h1 */}
        <section id="generator" className="py-12 bg-gradient-to-b from-purple-50 to-white">
          <RandomHairstyleGenerator />
        </section>

        {/* Discover Unique Hairstyle Ideas Section with Carousel */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">{config.discover.title}</h2>
            <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
              {config.discover.description}
            </p>
            <HairstyleSelector />
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            {config.painPoints.map((point, index) => (
              <div key={index} className="mb-12">
                <h3 className="text-2xl font-bold mb-4">{point.title}</h3>
                <p className="text-gray-600 leading-relaxed">{point.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Use Section */}
        <HowToUseSection 
          howToUseSection={{
            title: config.howTo.title,
            description: config.howTo.description,
            steps: config.howTo.steps.map(step => ({
              title: step.title,
              icon: "fas fa-check-circle",
              description: step.description
            })),
            image: {
              src: "/images/screenshots/random-hairstyle-generator-how-to.webp",
              alt: "How to use Random Hairstyle Generator"
            },
            ctaText: "Start Generating",
            ctaLink: "#generator"
          }}
        />

        {/* Usage Scenarios Section */}
        <UsageScenariosSection ctaSections={config.ctaSections} />

        {/* Why Choose Section with Testimonials */}
        <WhyChooseSection 
          whyChooseSection={config.whyChoose}
          testimonialsConfig={config.testimonialsConfig}
        />

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gray-50">
          <FAQ faqs={config.faq} />
        </section>

        {/* CTA Section */}
        <CTASection 
          finalCta={{
            title: config.cta.title,
            description: config.cta.description,
            ctaText: config.cta.primaryButton.text,
            ctaLink: config.cta.primaryButton.href
          }}
        />
      </main>
      <Footer />
    </div>
  );
}