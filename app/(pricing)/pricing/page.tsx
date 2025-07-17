import { Metadata } from "next";
import Script from "next/script";
import PricingPage from "./content-page";

export const metadata: Metadata = {
  title: "Pricing Plans - Hairstyle AI Pro",
  metadataBase: new URL("https://hair-style.ai"),
  description:
    "Choose from flexible pricing plans for Hairstyle AI Pro. Monthly and yearly subscriptions with 1000+ credits. Try 60+ AI hairstyles with premium features.",
  alternates: {
    canonical: "https://hair-style.ai/pricing",
  },
  icons: {
    icon: [
      { url: "/images/logo/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      {
        url: "/images/logo/logo-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/images/logo/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  authors: {
    name: "Jason",
    url: "https://hair-style.ai",
  },
  openGraph: {
    title: "Pricing Plans - Hairstyle AI Pro | Affordable Hair Styling Subscriptions",
    type: "website",
    url: "https://hair-style.ai/pricing",
    images: [
      {
        url: "https://hair-style.ai/images/hero/ba3.jpg",
        type: "image/jpeg",
        width: 1920,
        height: 1080,
        alt: "Hairstyle AI Pro Pricing Plans",
      },
    ],
    siteName: "Hairstyle AI",
    description:
      "Choose from flexible pricing plans for Hairstyle AI Pro. Monthly and yearly subscriptions with 1000+ credits. Try 60+ AI hairstyles with premium features.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@hair_styleai",
    title: "Pricing Plans - Hairstyle AI Pro | Affordable Hair Styling Subscriptions",
    description:
      "Choose from flexible pricing plans for Hairstyle AI Pro. Monthly and yearly subscriptions with 1000+ credits. Try 60+ AI hairstyles with premium features.",
    images: ["https://hair-style.ai/images/hero/ba3.jpg"],
    creator: "@hair_styleai",
  },
};

const pricingStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://hair-style.ai/pricing#product",
  name: "Hairstyle AI Pro",
  description: "Premium AI hairstyle generator with 60+ styles, unlimited generations, and advanced features for professional hair styling visualization.",
  brand: {
    "@type": "Brand",
    name: "Hairstyle AI"
  },
  offers: [
    {
      "@type": "Offer",
      "@id": "https://hair-style.ai/pricing#monthly",
      name: "Monthly Plan",
      price: "9.99",
      priceCurrency: "USD",
      priceValidUntil: "2025-12-31",
      availability: "https://schema.org/InStock",
      url: "https://hair-style.ai/pricing",
      description: "Monthly subscription with 1000 credits, 60+ hairstyles, and premium features",
      seller: {
        "@type": "Organization",
        name: "Hairstyle AI",
        url: "https://hair-style.ai"
      }
    },
    {
      "@type": "Offer",
      "@id": "https://hair-style.ai/pricing#yearly",
      name: "Yearly Plan",
      price: "69.99",
      priceCurrency: "USD",
      priceValidUntil: "2025-12-31",
      availability: "https://schema.org/InStock",
      url: "https://hair-style.ai/pricing",
      description: "Yearly subscription with 1000 credits per month, 60+ hairstyles, and premium features. Save 38% compared to monthly.",
      seller: {
        "@type": "Organization",
        name: "Hairstyle AI",
        url: "https://hair-style.ai"
      }
    }
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    bestRating: "5",
    ratingCount: "26135"
  },
  publisher: {
    "@type": "Organization",
    "@id": "https://hair-style.ai/#organization",
    name: "Hairstyle AI",
    url: "https://hair-style.ai"
  }
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://hair-style.ai/"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Pricing",
      item: "https://hair-style.ai/pricing"
    }
  ]
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What's included in the Hairstyle AI Pro subscription?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hairstyle AI Pro includes 1000 credits per month, access to 60+ premium hairstyles, unlimited style generations, priority processing, and advanced AI features for professional hair styling visualization."
      }
    },
    {
      "@type": "Question", 
      name: "Can I cancel my subscription anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can cancel your Hairstyle AI Pro subscription at any time. Simply contact us at hello@hair-style.ai with your email address and cancellation reason, and we'll process your request promptly."
      }
    },
    {
      "@type": "Question",
      name: "What's the difference between monthly and yearly plans?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both plans offer the same features and 1000 credits per month. The yearly plan saves you 38% compared to monthly billing - you pay $69.99/year instead of $119.88 when billed monthly."
      }
    },
    {
      "@type": "Question",
      name: "How do credits work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Credits are used to generate AI hairstyles. Each hairstyle generation uses 1 credit. You get 1000 credits per month with your subscription, and unused credits expire at the end of each billing cycle."
      }
    }
  ]
};

export default function Pricing() {
  return (
    <>
      <Script id="pricing-structured-data" type="application/ld+json">
        {JSON.stringify(pricingStructuredData)}
      </Script>
      <Script id="pricing-breadcrumb-structured-data" type="application/ld+json">
        {JSON.stringify(breadcrumbStructuredData)}
      </Script>
      <Script id="pricing-faq-structured-data" type="application/ld+json">
        {JSON.stringify(faqStructuredData)}
      </Script>
      <PricingPage />
    </>
  );
}