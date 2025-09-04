import Footer from "@/components/footer";
import { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/navbar";
import AdSense from "@/components/AdSense";
import MoreFreeAITools from "@/components/MoreFreeAITools";
import Image from "next/image";
import Link from "next/link";
import HairstyleSelector from "@/components/HairstyleSelector";
import Testimonials from "@/components/testimonials";
import FAQ from "@/components/faq";
import HowToStepsSection from "@/components/HowToStepsSection";
import CTASection from "@/components/CTASection";
import ScrollToTopButton from "@/components/ScrollToTopButton";

export const metadata: Metadata = {
  title: "AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles",
  metadataBase: new URL("https://hair-style.ai"),
  description:
    "Test hairstyles on my face free with AI hairstyle changer! Haistyle AI choose from over 60+ hairstyles for men and women, including bob, buzz cut, slicked back, braids and more.",
  alternates: {
    canonical: "https://hair-style.ai",
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
    title: "AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles",
    type: "website",
    url: "https://hair-style.ai",
    images: [
      {
        url: "https://hair-style.ai/images/hero/ba3.jpg",
        type: "image/jpeg",
        width: 1920,
        height: 1080,
        alt: "AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles",
      },
    ],
    siteName: "Hairstyle AI",
    description:
      "Test hairstyles on my face free with AI hairstyle changer! Haistyle AI choose from over 60+ hairstyles for men and women, including bob, buzz cut, slicked back, braids and more.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@hair_styleai",
    title: "AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles",
    description:
      "Test hairstyles on my face free with AI hairstyle changer! Choose from over 60+ hairstyles for men and women, including bob, buzz cut, slicked back, braids, and more.",
    images: ["https://hair-style.ai/images/hero/ba3.jpg"],
    creator: "@hair_styleai",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": "https://hair-style.ai/#webapplication",
  name: "Hairstyle AI",
  applicationCategory: "UtilitiesApplication",
  url: "https://hair-style.ai",
  description:
    "Test hairstyles on my face free with AI hairstyle changer! Haistyle AI choose from over 60+ hairstyles for men and women, including bob, buzz cut, slicked back, braids and more.",
  operatingSystem: "Windows, MacOS, Linux, ChromeOS, Android, iOS, iPadOS",
  ImageObject: "https://hair-style.ai/images/hero/ba3.jpg",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    bestRating: "5",
    ratingCount: "26135",
  },
  publisher: {
    "@type": "Organization",
    "@id": "https://hair-style.ai/#organization",
    name: "Hairstyle AI",
    url: "https://hair-style.ai",
  },
  faq: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is AI Hairstyle Changer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AI Hairstyle Changer is a free online tool. You upload a selfie, pick from 60+ hairstyles and 19 colors, and it puts the new hair on your photo.",
        },
      },
      {
        "@type": "Question",
        name: "Is it really free to use AI Hairstyle Changer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our AI Hairstyle Changer are free twice to use. You can upload your image, try on AI virtual hairstyles, and experiment with different colors without any cost and no sign-up needed.",
        },
      },
      {
        "@type": "Question",
        name: "How does AI Hairstyle Changer work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Step 1: Upload your photo. Step 2: Choose a hairstyle. Step 3: Pick a color. Step 4: See your new look! Easy online hairstyle changer for men and women.",
        },
      },
      {
        "@type": "Question",
        name: "What file formats are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can upload JPG and PNG photos. The photo hair editor online free works best with clear, front-facing selfies.",
        },
      },
      {
        "@type": "Question",
        name: "Is there an AI hairstyle changer that lets you try on different hairstyles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! AI hairstyle changer is a versatile hairstyle changer. You can try short, long, men's, or women's AI virtual hairstyles easily.",
        },
      },
      {
        "@type": "Question",
        name: "How do I change my hairstyle with Hairstyle AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Step 1: Go to AI hairstyle changer. Step 2: Upload your picture. Step 3: Pick a style and color. Step 4: Download your new hairstyle photo!",
        },
      },
      {
        "@type": "Question",
        name: "Is it safe to upload my image to AI hairstyle changer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely! We take your privacy seriously. Your uploaded images are processed securely and are not stored permanently. We use advanced encryption to protect your data, and all images are automatically deleted after processing.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use AI Hairstyle Changer on my phone?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Our AI haircut simulator tools are fully mobile-responsive and works perfectly on smartphones and tablets. You can easily upload photos from your mobile device and try on different hairstyles on the go.",
        },
      },
      {
        "@type": "Question",
        name: "How to try on versatile haircut on my face?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It's simple! Just upload a clear photo of your face, select from our wide range of hairstyle options, and AI hairstyle changer will automatically apply the chosen style to your photo. You can also experiment with different hair colors to find your perfect look.",
        },
      },
      {
        "@type": "Question",
        name: "Can AI hairstyle changer fix my hair in a photo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! The AI hairstyle changer lets you fix or completely change your hair in pictures. It's the AI hairstyle changer.",
        },
      },
      {
        "@type": "Question",
        name: "What is the AI hairstyle changer that changes hair color?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AI hairstyle changer is the AI Virtual generator that changes hair color. You can pick from 19 colors when testing hairstyles on your face free.",
        },
      },
      {
        "@type": "Question",
        name: "Can AI hairstyle changer tell me what hairstyle suits me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "While our AI hairstyle changer help you visualize different hairstyles on your face, the best hairstyle choice ultimately depends on your personal preference and style. We recommend trying multiple styles and colors to find what makes you feel most confident.",
        },
      },
    ],
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://hair-style.ai/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Hairstyle AI Tools",
        item: "https://hair-style.ai/ai-hairstyle",
      },
    ],
  },
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hairstyle AI",
    url: "https://hair-style.ai",
    logo: {
      "@type": "ImageObject",
      "@id": "https://hair-style.ai/images/logo-192x192.png",
      url: "https://hair-style.ai/images/logo/logo-192x192.png",
      width: 192,
      height: 192,
      caption: "Hairstyle AI Logo",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://hair-style.ai/#organization",
      name: "Hairstyle AI",
      url: "https://hair-style.ai",
    },
  },
  website: {
    "@type": "WebSite",
    url: "https://hair-style.ai",
    name: "Hairstyle AI",
  },
};

// Testimonials data
const testimonialsData = [
  {
    quote:
      "I've always been hesitant to try on new hairstyles because I wasn't sure how they'd look on me. With AI hairstyle changer, I uploaded my photo and tried out different styles, which gave me the confidence to switch to a modern fade. It's a game-changer for anyone unsure about new looks.",
    author: "Mark",
    title: "Financial Analyst",
    rating: 5,
  },
  {
    quote:
      "As a professional photographer, I needed to visualize different hairstyles for my clients before photoshoots. AI hairstyle changer has become an essential part of my pre-shoot consultation. It helps clients make confident decisions about their styling and saves us both time and uncertainty.",
    author: "Emily",
    title: "Professional Photographer",
    rating: 5,
  },
  {
    quote:
      "The accuracy of AI hairstyle changer is impressive! I was skeptical at first, but after trying several hairstyles, I found the perfect look for my wedding day. The ability to experiment with different colors and styles helped me avoid any styling regrets on my big day.",
    author: "Sophie",
    title: "Interior Designer",
    rating: 5,
  },
  {
    quote:
      "Working in tech, I appreciate tools that combine innovation with practicality. AI hairstyle changer does exactly that. It's intuitive, fast, and surprisingly accurate. I used it before my recent makeover and the actual result matched the preview perfectly.",
    author: "James",
    title: "Software Developer",
    rating: 5,
  },
  {
    quote:
      "Being a style consultant, I recommend AI hairstyle changer to all my clients. It's revolutionized how we approach hair makeovers. The realistic previews and variety of options make it easy for clients to visualize their transformation. It's become an indispensable tool in my consulting process.",
    author: "Lisa",
    title: "Style Consultant",
    rating: 5,
  },
];

// FAQ data
const faqData = [
  {
    question: "What is AI Hairstyle Changer?",
    answer:
      "AI Hairstyle Changer is a free online tool. You upload a selfie, pick from 60+ hairstyles and 19 colors, and it puts the new hair on your photo.",
  },
  {
    question: "Is it really free to use AI Hairstyle Changer?",
    answer:
      "Yes, our AI Hairstyle Changer are free twice to use. You can upload your image, try on AI virtual hairstyles, and experiment with different colors without any cost and no sign-up needed.",
  },
  {
    question: "How does AI Hairstyle Changer work?",
    answer:
      "Step 1: Upload your photo. Step 2: Choose a hairstyle. Step 3: Pick a color. Step 4: See your new look! Easy online hairstyle changer for men and women.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "You can upload JPG and PNG photos. The photo hair editor online free works best with clear, front-facing selfies.",
  },
  {
    question:
      "Is there an AI hairstyle changer that lets you try on different hairstyles?",
    answer:
      "Yes! AI hairstyle changer is a versatile hairstyle changer. You can try short, long, men's, or women's AI virtual hairstyles easily.",
  },
  {
    question: "How do I change my hairstyle with Hairstyle AI?",
    answer:
      "Step 1: Go to AI hairstyle changer. Step 2: Upload your picture. Step 3: Pick a style and color. Step 4: Download your new hairstyle photo!",
  },
  {
    question: "Is it safe to upload my image to AI hairstyle changer?",
    answer:
      "Absolutely! We take your privacy seriously. Your uploaded images are processed securely and are not stored permanently. We use advanced encryption to protect your data, and all images are automatically deleted after processing.",
  },
  {
    question: "Can I use AI Hairstyle Changer on my phone?",
    answer:
      "Yes! Our AI haircut simulator tools are fully mobile-responsive and works perfectly on smartphones and tablets. You can easily upload photos from your mobile device and try on different hairstyles on the go.",
  },
  {
    question: "How to try on versatile haircut on my face?",
    answer:
      "It's simple! Just upload a clear photo of your face, select from our wide range of hairstyle options, and AI hairstyle changer will automatically apply the chosen style to your photo. You can also experiment with different hair colors to find your perfect look.",
  },
  {
    question:
      "Is there an AI hairstyle changer that lets you try on different hairstyles?",
    answer:
      "Yes! AI hairstyle changer is a free online AI hairstyle changer. You can try short, long, men's, or women's versatile hairstyle easily.",
  },
  {
    question: "Can AI hairstyle changer fix my hair in a photo?",
    answer:
      "Yes! The AI hairstyle changer lets you fix or completely change your hair in pictures. It's the AI hairstyle changer.",
  },
  {
    question: "What is the AI hairstyle changer that changes hair color?",
    answer:
      "AI hairstyle changer is the AI Virtual generator that changes hair color. You can pick from 19 colors when testing hairstyles on your face free.",
  },
  {
    question: "Can AI hairstyle changer tell me what hairstyle suits me?",
    answer:
      "While our AI hairstyle changer help you visualize different hairstyles on your face, the best hairstyle choice ultimately depends on your personal preference and style. We recommend trying multiple styles and colors to find what makes you feel most confident.",
  },
];

// How to steps section data
const howToStepsData = {
  title: "How to Change Hairstyle With Hairstyle AI",
  description:
    "Transform your hairstyle look with our AI hairstyle changer in just three simple steps. Upload your photo, choose from our diverse collection of hairstyles, and instantly see yourself with a new look!",
  ctaText: "Try on Free AI Hairstyle Changer Now",
  ctaLink: "/ai-hairstyle",
};

// Final CTA data
const finalCtaData = {
  title: "Ready to Find Your Perfect Hairstyle with Hairstyle AI?",
  description:
    "Not sure which hairstyle suits you? Try on 60+ hairstyles for free with our AI hairstyle changer—upload your photo and find the perfect look in just a few clicks!",
  ctaText: "Try AI Hairstyle Changer Now",
  ctaLink: "/ai-hairstyle",
};

export default function Home() {
  return (
    <>
      <Script id="application-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
      <Script id="faq-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData.faq)}
      </Script>
      <Script id="breadcrumb-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData.breadcrumb)}
      </Script>
      <Script id="organization-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData.organization)}
      </Script>
      <Script id="website-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData.website)}
      </Script>
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative">
          <div className="container mx-auto px-4 py-4 md:py-8 mb-6 md:mb-10">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-2 items-center max-w-6xl mx-auto">
              {/* Image - Mobile top, Desktop right */}
              <div className="flex justify-center order-1 lg:order-2 mb-4 lg:mb-0">
                <div
                  className="w-full max-w-sm lg:max-w-lg mx-auto"
                  style={{ aspectRatio: "4:3" }}
                >
                  <Image
                    src="/images/optimized/hero/hero4.webp"
                    alt="AI Hairstyle Preview - Showcase of before and after hairstyle transformations using artificial intelligence"
                    className="w-full h-full object-cover rounded-lg"
                    width={700}
                    height={700}
                    priority={true}
                  />
                </div>
              </div>

              {/* Content - Mobile bottom, Desktop left */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <h1 className="text-3xl sm:text-5xl font-bold mb-3 lg:mb-6 mt-1 lg:mt-10 text-gray-800">
                  Free AI Hairstyle Changer Online - for Men and Women
                </h1>

                <p className="text-base sm:text-lg text-gray-800 mb-4">
                  Not sure which hairstyle suits you best? Upload photo, let our
                  free AI hairstyle changer help you try on{" "}
                  <span className="font-bold">
                    60+ hairstyles and 19 colors filters
                  </span>{" "}
                  in just a few clicks! Whether you want short, curly, wavy or bold
                  hairstyles like buzz cuts and braids, Hairstyle AI helps you
                  experiment without a trip to the salon.
                </p>

                <p className=" text-gray-800 text-lg mb-4">
                  Whether you need online hairstyles for{" "}
                  <span className="font-bold">men or women</span>, this tool has it
                  all. Hairstyle try on has never been easier – upload your photo
                  and explore the best styles!
                </p>

                {/* Rating */}
                <div className="flex items-start justify-center lg:justify-start gap-3 mb-6">
                  <div className="flex items-center -space-x-2">
                    {[
                      "/images/review/review1.webp",
                      "/images/review/review2.webp",
                      "/images/review/review3.webp",
                      "/images/review/review4.webp",
                    ].map((image, index) => (
                      <div
                        key={index}
                        className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white"
                      >
                        <Image
                          src={image}
                          alt={`User review ${index + 1}`}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-base text-gray-800">
                      4.9/5 from 50k+ users
                    </span>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-6 mt-6">
                  <Link
                    href="/ai-hairstyle"
                    className="btn bg-purple-700 hover:bg-purple-800 text-white btn-lg rounded-2xl px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300"
                  >
                    Try on Now
                  </Link>
                </div>
              </div>
            </div>
          </div>


        </section>

        {/* Ad Position 1 - Top */}
        <section className="bg-white py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2318931889728296"
                   crossorigin="anonymous"></script>
              <ins className="adsbygoogle"
                   style={{display:'block'}}
                   data-ad-client="ca-pub-2318931889728296"
                   data-ad-slot="1924105465"
                   data-ad-format="auto"
                   data-full-width-responsive="true"></ins>
              <script>
                   (window.adsbygoogle = window.adsbygoogle || []).push({});
              </script>
            </div>
          </div>
        </section>

        {/* Hairstyle Selector Section */
        <section>
          <HairstyleSelector />
        </section>

        {/* How to Steps Section */}
        <section>
          <HowToStepsSection 
            title={howToStepsData.title}
            description={howToStepsData.description}
            ctaText={howToStepsData.ctaText}
            ctaLink={howToStepsData.ctaLink}
          />
        </section>

        {/* Virtual Hairstyles Section */}
        <section className="bg-white">
            <div className="container mx-auto px-4 py-4">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm order-1 lg:order-2">
                    <Image
                      src="/images/hero/ba3.jpg"
                      alt="Before and after comparison of hairstyle AI transformation showing dramatic style change"
                      className="w-[340px] md:w-[440px] h-[350px] md:h-[450px] object-cover rounded-xl"
                      width={440}
                      height={450}
                    />
                  </div>
                  <div className="order-1 lg:order-2">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
                      How can I try on AI virtual hairstyles on my face?
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 mb-8">
                      Do you worry that after getting a new hairstyle at the salon,
                      it might not suit your face shape or style? AI hairstyle
                      changer helps you try on AI virtual hairstyles before making a
                      decision. Simply upload your photo, choose a popular hairstyle
                      and instantly see how it looks on your face. Want to test
                      hairstyles on my face? Just upload your image and start
                      exploring!
                    </p>
                    <Link
                      href="/ai-hairstyle"
                      className="btn bg-purple-700 text-white btn-lg rounded-xl"
                    >
                      Try on Free AI Hairstyle Changer Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* Ad Position 2 - Middle */}
        <section className="bg-gray-50 py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2318931889728296"
                   crossorigin="anonymous"></script>
              <ins className="adsbygoogle"
                   style={{display:'block'}}
                   data-ad-client="ca-pub-2318931889728296"
                   data-ad-slot="1924105465"
                   data-ad-format="auto"
                   data-full-width-responsive="true"></ins>
              <script>
                   (window.adsbygoogle = window.adsbygoogle || []).push({});
              </script>
            </div>
          </div>
        </section>

        {/* Face Shape Guide Section */
        <section className="container mx-auto px-4 py-4 sm:py-20">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-16 items-center">
                <div className="flex justify-center lg:justify-end order-1 lg:order-2 mb-8 lg:mb-0">
                  <Image
                    src="/images/hero/change.jpg"
                    alt="Multiple hairstyle options showcasing different looks on the same person using hairstyle AI technology"
                    className="w-[300px] md:w-[430px] h-[320px] md:h-[470px] object-cover rounded-xl"
                    width={430}
                    height={470}
                  />
                </div>

                <div className="order-2 lg:order-1">
                  <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
                    What Haircut Fits My Face?
                  </h2>
                  <div className="space-y-6 text-base sm:text-lg text-gray-600 ">
                    <p>
                      Choosing the right hairstyle depends on your face shape and
                      the style you want to express.
                    </p>
                    <p>
                      <Link
                        href="/ai-hairstyle-male"
                        className="font-bold text-purple-700 hover:text-purple-900 transition-colors"
                      >
                        For Men
                      </Link>{" "}
                      if you have a round face try on a classic pompadour hairstyle
                      or a side part with a fade. These hairstyles create height and
                      angles, making your face appear more defined. For a square
                      face, a softer, textured crop or quiff can add some flow and
                      balance out sharp features.
                    </p>
                    <p>
                      <Link
                        href="/ai-hairstyle-online-free-female"
                        className="font-bold text-purple-700 hover:text-purple-900 transition-colors"
                      >
                        For Women
                      </Link>{" "}
                      a heart-shaped face suits hairstyles that balance the wider
                      forehead, such as a soft side-swept bang with a long bob or
                      wavy hair. If you have an oval face, almost any hairstyle
                      works, but a sleek pixie cut or a blunt bob can emphasize your
                      facial features beautifully. For a round face, a layered bob
                      or long waves with side-swept bangs can elongate the face,
                      adding sophistication and elegance.
                    </p>
                    <p>
                      If you're still unsure, you can easily find your answer with
                      our online AI hairstyle changer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* AI Hairstyle Changer Info Section */}
        <section className="bg-gray-50">
            <div className="container mx-auto px-4 py-20">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="order-1 lg:order-2">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800">
                      What is AI Hairstyle Changer?
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 mb-8">
                      Are you still unsure about what hairstyle to wear for your
                      next event? Our AI hairstyle changer are here to help! Simply
                      upload your photo, choose a popular hairstyle like a sleek
                      bob, trendy pixie cut, or bold pompadour, and instantly see
                      how it looks with different hair colors. You can easily
                      experiment with various hairstyles and colors to find the
                      perfect match for your face and personality. Try on AI
                      hairstyle changer today and discover your ideal hairstyle in
                      just a few clicks!
                    </p>
                    <Link
                      href="/ai-hairstyle"
                      className="btn bg-purple-700 text-white btn-lg rounded-xl"
                    >
                      Try on AI Hairstyle Changer Now
                    </Link>
                  </div>
                  <div className="bg-gray-50 rounded-xl shadow-lg">
                    <Image
                      src="/images/hero/ba5.jpg"
                      alt="Side-by-side comparison demonstrating the power of AI haircut simulator technology"
                      className="w-[600px] h-[290px] object-cover rounded-xl"
                      width={600}
                      height={290}
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* More AI Tools Section */}
        <section>
          <MoreFreeAITools
            toolNames={[
              "Random Hairstyle Generator",
              "Man Bun Filter",
              "Textured Fringe Filter",
              "Hairstyles for Girls",
              "Dreadlocks Filter",
              "Bob Haircut Filter",
              "Men's Hairstyles",
              "Buzz Cut Filter",
              "Short Hair Filter",
              "AI Hairstyle Male",
              "AI Hairstyle Online Free Female",
              "Hairstyle for Girls",
            ]}
          />
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-white py-6 md:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-4xl font-bold text-center mb-2 md:mb-16 text-gray-800">
                  What Users Are Saying About Hairstyle AI?
                </h2>
                <Testimonials testimonials={testimonialsData} />
              </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-gray-50">
          <div className="container mx-auto px-4 py-2 md:py-16">
            <div className="max-w-6xl mx-auto">
              <FAQ faqs={faqData} />
            </div>
          </div>
        </section>

        {/* Ad Position 3 - Bottom */}
        <section className="bg-white py-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2318931889728296"
                   crossorigin="anonymous"></script>
              <ins className="adsbygoogle"
                   style={{display:'block'}}
                   data-ad-client="ca-pub-2318931889728296"
                   data-ad-slot="1924105465"
                   data-ad-format="auto"
                   data-full-width-responsive="true"></ins>
              <script>
                   (window.adsbygoogle = window.adsbygoogle || []).push({});
              </script>
            </div>
          </div>
        </section>

        {/* Final CTA Section */
        <section className="bg-white py-16 px-4">
            <div className="max-w-full mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                Ready to Find Your Perfect Hairstyle with Hairstyle AI?
              </h2>
              <p className="text-base md:text-xl text-gray-800 mb-10 max-w-3xl mx-auto">
                Not sure which hairstyle suits you? Try on 60+ hairstyles for free
                with our AI hairstyle changer—upload your photo and find the perfect
                look in just a few clicks!
              </p>
              <ScrollToTopButton />
            </div>
        </section>
        <Footer />
      </div>
    </>
  );
}