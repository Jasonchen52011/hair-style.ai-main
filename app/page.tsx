import Hero from "@/components/hero";
import Footer from "@/components/footer";
import { Metadata } from 'next'
import Script from 'next/script';
import Navbar from '@/components/navbar';
import { publicDecrypt } from "crypto";


export const metadata: Metadata = {
    title: 'AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles',
    metadataBase: new URL('https://hair-style.ai'),
    description: 'Free AI Hairstyle Changer, discover your perfect look! Choose from over 60+ hairstyles, including bob, wavy curls, buzz cut, slicked back, braids, and more',
    alternates: {
        canonical: 'https://hair-style.ai'
    },
    icons: {
      icon: [
        {url: '/images/logo/favicon.ico',sizes: '48x48',type: 'image/x-icon',},
        {url: '/images/logo/logo-192x192.png',sizes: '192x192',type: 'image/png',},
      ],
      apple: [{url: '/images/logo/apple-touch-icon.png',sizes: '180x180',type: 'image/png',}],
    },
    authors: {
        name: 'Jason',
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
              alt: 'AI Hairstyle Changer: Free Haircut Simulator with 60+ Styles'    
            }
          ],
        siteName: 'Hair Style AI',
        description: 'One-click free AI hairstyle change! Choose from over 60 hairstyles, including bob, wavy curls, buzz cut, bald, slicked back, braids, and more.',
        locale: 'en_US',
      
    },
    twitter: {
        card: 'summary_large_image',
        site: '@hair_styleai',
        title: 'Hair Style AI - Free AI Hairstyle Changer',
        description: 'Free AI Hairstyle Changer, discover your perfect look! Choose from over 60+ hairstyles, including bob, wavy curls, buzz cut, slicked back, braids, and more',
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

}

const structuredData = {
        '@context': "https://schema.org",
        '@type': "WebApplication",
        '@id': "https://hair-style.ai/#webapplication",
        name: "Hair Style AI",
        applicationCategory: 'EntertainmentApplication',
        url: "https://hair-style.ai",
        description: "Try on different hairstyles with AI technology",
        operatingSystem: 'Windows, MacOS, Linux, ChromeOS, Android, iOS, iPadOS',
        ImageObject: "https://hair-style.ai/images/hero/ba3.jpg",
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            worstRating: '1',
            bestRating: '5',
            ratingCount: '3352'
        },
        publisher: {
          '@type': 'Organization',
          '@id': "https://hair-style.ai/#organization",
          name: 'Hair Style AI',
          url: 'https://hair-style.ai'
        },
        faq: {
        '@type': "FAQPage",
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is AI Hairstyle Changer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AI Hairstyle Changer is a free online tool. You upload a selfie, pick from 60+ hairstyles and 19 colors, and it puts the new hair on your photo.'
            }
          },
          {
            '@type': 'Question',
            name: 'Is it really free to use AI Hairstyle Changer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, our AI Hairstyle Changer are completely free to use. You can upload your image, try on AI virtual hairstyles, and experiment with different colors without any cost and no sign-up needed.'
            }
          },
          {
            '@type': 'Question',
            name: 'How does AI Hairstyle Changer work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Step 1: Upload your photo. Step 2: Choose a hairstyle. Step 3: Pick a color. Step 4: See your new look! Easy online hairstyle changer for men and women.'
            }
          },
          {
            '@type': 'Question',
            name: 'What file formats are supported?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can upload JPG and PNG photos. The photo hair editor online free works best with clear, front-facing selfies.'
            }
          },
          {
            '@type': 'Question',
            name: 'Is there an AI simulator haircut tool that lets you try on different hairstyles?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! AI haircut simulator is a versatile haircut tool. You can try short, long, men\'s, or women\'s AI virtual hairstyles easily.'
            }
          },
          {
            '@type': 'Question',
            name: 'How do I change my hairstyle with AI?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Step 1: Go to AI haircut simulator. Step 2: Upload your picture. Step 3: Pick a style and color. Step 4: Download your new hairstyle photo!'
            }
          },
          {
            '@type': 'Question',
            name: 'Is it safe to upload my image to hairstyle AI changer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Absolutely! We take your privacy seriously. Your uploaded images are processed securely and are not stored permanently. We use advanced encryption to protect your data, and all images are automatically deleted after processing.'
            }
          },
          {
            '@type': 'Question',
            name: 'Can I use AI Hairstyle Changer on my phone?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! Our AI haircut simulator tools are fully mobile-responsive and works perfectly on smartphones and tablets. You can easily upload photos from your mobile device and try on different hairstyles on the go.'
            }
          },
          {
            '@type': 'Question',
            name: 'How to try on versatile haircut on my face?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'It\'s simple! Just upload a clear photo of your face, select from our wide range of hairstyle options, and our AI will automatically apply the chosen style to your photo. You can also experiment with different hair colors to find your perfect look.'
            }
          },
          {
            '@type': 'Question',
            name: 'Can AI fix my hair in a photo?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! The AI haircut simulator lets you fix or completely change your hair in pictures. It\'s the AI haircut simulator.'
            }
          },
          {
            '@type': 'Question',
            name: 'What is the AI that changes hair color?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AI haircut simulator is the AI Virtual generator that changes hair color. You can pick from 19 colors when testing hairstyles on your face free.'
            }
          },
          {
            '@type': 'Question',
            name: 'Can hairstyle AI changer tell me what hairstyle suits me?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'While our hairstyle AI changer help you visualize different hairstyles on your face, the best hairstyle choice ultimately depends on your personal preference and style. We recommend trying multiple styles and colors to find what makes you feel most confident.'
            }
          }
        ]
       },
    breadcrumb: {
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
    },
    organization: {
        '@context': "https://schema.org",
        '@type': "Organization",
        'name': "Hair Style AI",
        'url': "https://hair-style.ai",
        'logo': {
            '@type': "ImageObject",
            '@id': "https://hair-style.ai/images/logo-192x192.png",
            'url': "https://hair-style.ai/images/logo/logo-192x192.png",
            'width': 192,
            'height': 192,
            'caption': "Hair Style AI Logo"
        },
        publisher: {
          '@type': 'Organization',
          '@id': "https://hair-style.ai/#organization",
          name: 'Hair Style AI',
          url: 'https://hair-style.ai'
        },
    
    },
    website: {
        '@type': "WebSite",
        'url': "https://hair-style.ai",
        'name': "Hair Style AI",
    }
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
                <Hero />
                <Footer />
            </div>
        </>
    )
}


