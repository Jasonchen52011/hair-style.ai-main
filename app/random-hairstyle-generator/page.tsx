import { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import RandomHairstyleGenerator from "./tool-page";
import HairstyleSelector from "@/components/HairstyleSelector";
import HowToUseSection from "@/components/HowToUseSection";
import UsageScenariosSection from "@/components/UsageScenariosSection";
import UniqueSection from "@/components/UniqueSection";
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
        <section id="generator" className=" bg-gray-50">
          <RandomHairstyleGenerator />
        </section>

        {/* Discover Unique Hairstyle Ideas Section with Carousel */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">{config.discover.title}</h2>
            <p className="text-center text-gray-600 text-lg mb-8 max-w-4xl mx-auto">
              {config.discover.description}
            </p>
            <HairstyleSelector showHeader={false} />
          </div>
        </section>

        {/* Pain Points Section - Using UniqueSection */}
        <UniqueSection sections={config.painPoints} />

        {/* How to Use Section */}
        <HowToUseSection 
          howToUseSection={{
            title: config.howTo.title,
            description: config.howTo.description,
            steps: config.howTo.steps.map((step, index) => ({
              title: step.title,
              icon: index === 0 ? "fas fa-sliders-h" : 
                    index === 1 ? "fas fa-magic" : 
                    index === 2 ? "fas fa-eye" : 
                    "fas fa-download",
              description: step.description
            })),
            image: {
              src: "/images/screenshots/random-hairstyle-generator-how-to.webp",
              alt: "How to use Random Hairstyle Generator"
            },
            ctaText: "Try Random Hairstyle Generator Now",
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