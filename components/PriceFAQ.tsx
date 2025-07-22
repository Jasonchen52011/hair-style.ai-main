"use client";

import FAQ from "@/components/faq";

export default function PriceFAQ() {
  const pricingFAQs = [
    {
      question: "What payment methods do you support?",
      answer:
        "We use Stripe as our payment processor, which supports a wide range of secure payment methods including major credit cards (Visa, Mastercard, American Express) and debit cards. All transactions are processed through secure, encrypted channels to ensure your payment information is protected. Stripe is a trusted payment platform that complies with international security standards, providing you with a safe and reliable checkout experience.",
    },
    {
      question: "How secure is Hairstyle AI?",
      answer:
        "Security is our top priority at Hairstyle AI. We implement industry-standard security measures including SSL encryption for all data transmission, secure cloud storage with enterprise-grade protection, and regular security audits. Your uploaded photos are processed securely and automatically deleted after processing. We never store your personal images permanently, and all user data is protected according to international privacy standards. Our platform is built with privacy-by-design principles to ensure your information remains safe and confidential.",
    }
  ];

  return <FAQ faqs={pricingFAQs} />;
}