"use client";

import FAQ from "@/components/faq";

export default function PriceFAQ() {
  const pricingFAQs = [
    {
      question: "What payment methods do you support?",
      answer:
        "We use Creem as our payment processor, which supports a wide range of secure payment methods including major credit cards (Visa, Mastercard, American Express) and debit cards. All transactions are processed through secure, encrypted channels to ensure your payment information is protected. Creem is a trusted payment platform that complies with international security standards, providing you with a safe and reliable checkout experience.",
    },
    {
      question: "How secure is Hairstyle AI?",
      answer:
        "Security is our top priority at Hairstyle AI. We implement industry-standard security measures including SSL encryption for all data transmission, secure cloud storage with enterprise-grade protection, and regular security audits. Your uploaded photos are processed securely and automatically deleted after processing. We never store your personal images permanently, and all user data is protected according to international privacy standards. Our platform is built with privacy-by-design principles to ensure your information remains safe and confidential.",
    },
    {
      question: "How can I change my subscription plan?",
      answer:
        "You can easily change your subscription plan at any time:<br><br><strong>Upgrading from Monthly to Yearly:</strong> We support immediate cancellation of your next month's billing cycle while preserving all your unused monthly credits, which will be added to your new yearly subscription. This ensures you don't lose any credits during the transition.<br><br><strong>Downgrading from Yearly to Monthly:</strong> We support immediate cancellation of your yearly subscription. Please note that subscription fees are non-refundable, but you'll retain access to all features until your current billing period ends, after which your account will switch to the monthly plan.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "To cancel your subscription, we recommend contacting us directly via email at <a href='mailto:hello@hair-style.ai' class='text-purple-600 hover:text-purple-800'>hello@hair-style.ai</a>. Our support team will assist you with the cancellation process and answer any questions you may have. Please include your account email and reason for cancellation in your message so we can process your request quickly and provide any necessary assistance.",
    },
    {
      question: "Will my data be lost if I cancel my paid plan?",
      answer:
        "When you cancel your paid plan, here's what happens to your data:<br><br><strong>Credits:</strong> We will preserve all your remaining credits, so you won't lose any unused credits from your subscription.<br><br><strong>Generated Images:</strong> We do not permanently store your generated hairstyle images on our servers. Images are processed and delivered to you immediately, then automatically deleted for privacy protection.<br><br><strong>Plan Changes:</strong> If you switch to a different plan, all credits from your previous plan will be retained and carried over to your new subscription, ensuring no loss of value during transitions.",
    },
  ];

  return <FAQ faqs={pricingFAQs} />;
}