import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Navbar from '@/components/navbar';
import { Metadata } from 'next'
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'AI Hairstyle Changer: Free Haircut Simulator with 56 Styles',
    description: 'Free AI Hairstyle Changer,discover your perfect look! Choose from over 56 hairstyles, including bob, wavy curls, buzz cut, bald, slicked back, braids, and more',
    alternates: {
        canonical: 'https://hair-style.ai'
    },
    authors: {
        name: 'Hair-style.ai',
        url: 'https://hair-style.ai',
    },
    openGraph: {
        title: 'Hair Style AI - Free AI Hairstyle Changer',
        type: 'website',
        url: 'https://hair-style.ai',
        images: [
            {
              url: 'https://hair-style.ai/images/hero/ba3.jpg',
              type: 'image/jpeg',
              width: 1920,
              height: 1080,
              alt: 'AI Hairstyle Changer: Free Haircut Simulator with 56 Styles'    
            }
          ],
        siteName: 'Hair-style.ai',
        description: 'One-click free AI hairstyle change! Choose from over 60 hairstyles, including bob, wavy curls, buzz cut, bald, slicked back, braids, and more.',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        site: '@hair_styleai',
        title: 'Hair-style.ai | AI Powered Hairstyle Transformation',
        description: 'Transform your look with AI-powered hairstyle visualization. Try different hairstyles instantly!',
        images: ['https://hair-style.ai/images/hero/ba3.jpg'],
        creator: '@hair_styleai',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    icons: {
        icon: [
            {
                url: '/images/logo/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        url: '/images/logo/favicon.svg',
        type: 'image/svg',
      },
      {
        url: '/images/logo/logo-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
}

export default function Home() {
    return (
        <>
            <Script id="application-structured-data" type="application/ld+json">
                {JSON.stringify({
                    '@context': "https://schema.org",
                    '@type': "WebApplication",
                    name: "Hair Style AI",
                    applicationCategory: 'UtilityApplication',
                    url: "https://hair-style.ai",
                    description: "Try on different hairstyles with AI technology",
                    operatingSystem: 'Windows, MacOS, Linux, ChromeOS, Android, iOS, iPadOS',
                    image: "https://hair-style.ai/images/hero/ba3.jpg",
                    offers: {
                        '@type': 'Offer',
                        price: '0',
                        priceCurrency: 'USD'
                    },
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: '4.8',
                        bestRating: '5',
                        ratingCount: '352'
                    }
                })}
            </Script>

            <Script id="faq-structured-data" type="application/ld+json">
                {JSON.stringify({
                    '@context': "https://schema.org",
                    '@type': "FAQPage",
                    mainEntity: [
                        {
                            '@type': 'Question',
                            name: 'Is it really free to use AI hairstyle changer?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Yes, our AI hairstyle changer is completely free to use. You can upload your image, try various hairstyles, and experiment with different colors without any cost.'
                            }
                        },
                        {
                            '@type': 'Question',
                            name: 'Is it safe to upload my image to hairstyle generator?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Absolutely! We take your privacy seriously. Your uploaded images are processed securely and are not stored permanently. We use advanced encryption to protect your data, and all images are automatically deleted after processing.'
                            }
                        },
                        {
                            '@type': 'Question',
                            name: 'Can I use AI hairstyle generator on my phone?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Yes! Our AI hairstyle generator is fully mobile-responsive and works perfectly on smartphones and tablets. You can easily upload photos from your mobile device and try different hairstyles on the go.'
                            }
                        },
                        {
                            '@type': 'Question',
                            name: 'How to try hairstyles on my face?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: "It's simple! Just upload a clear photo of your face, select from our wide range of hairstyle options, and our AI will automatically apply the chosen style to your photo. You can also experiment with different hair colors to find your perfect look."
                            }
                        },
                        {
                            '@type': 'Question',
                            name: 'Can AI tell me what hairstyle suits me?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: "While our AI tool helps you visualize different hairstyles on your face, the best hairstyle choice ultimately depends on your personal preference and style. We recommend trying multiple styles and colors to find what makes you feel most confident."
                            }
                        }
                    ]
                })}
            </Script>
            <Script id="breadcrumb-structured-data" type="application/ld+json">
                {JSON.stringify({
                    '@context': "https://schema.org",
                '@type': "BreadcrumbList",
                itemListElement: [
                    {
                        '@type': "ListItem",
                        position: 1,
                        name: "Home",
                        item: "https://hair-style.ai/"
                    },
                    {
                        '@type': "ListItem",
                        position: 2,
                        name: "Hair Style AI Tools",
                        item: "https://hair-style.ai/ai-hairstyle"
                    }
                ]
            })}
            </Script>
            <Script id="image-structured-data" type="application/ld+json">
                {JSON.stringify({
                    '@context': "https://schema.org",
                    '@type': "ImageObject",
                    '@id': "https://hair-style.ai/",
                    'inLanguage': "en-US",
                    'url': "https://hair-style.ai/images/hero/hero4.jpg",
                    'contentUrl': "https://hair-style.ai/images/hero/hero4.jpg",
                    'width': 800,
                    'height': 600,
                    'caption': "AI Hairstyle Changer Preview"
                })}
            </Script>
            <Script id="organization-structured-data" type="application/ld+json">
                {JSON.stringify({
                    '@context': "https://schema.org",
                    '@type': "Organization",
                    '@id': "https://hair-style.ai/#organization",
                    'name': "Hair Style AI",
                    'url': "https://hair-style.ai",
                    'logo': {
                        '@type': "ImageObject",
                        'url': "https://hair-style.ai/images/logo/logo-192x192.png",
                        'width': 192,
                        'height': 192
                    },
                    'sameAs': [
                        "https://x.com/hair_styleai"
                    ],
                    'description': "AI-powered hairstyle transformation platform offering free virtual hair makeovers with over 56 different styles."
                })}
            </Script>
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <Hero />
                <Footer />
            </div>
        </>
    )
}


