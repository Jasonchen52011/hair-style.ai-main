import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Navbar from '@/components/navbar';
import { Metadata } from 'next'
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles',
    description: 'Free AI hairstyle changer! Choose from over 60+ hairstyles, including bob, wavy curls, buzz cut, bald, slicked back, braids, and more.',
    alternates: {
        canonical: 'https://hair-style.ai'
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
              alt: 'AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles'    
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
    }
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
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <Hero />
                <Footer />
            </div>
        </>
    )
}


