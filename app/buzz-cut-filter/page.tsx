import PageContent from './page-content';
import { Metadata } from 'next';



const structuredData = {
    metadataBase: new URL('https://hair-style.ai'),
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    url: 'https://hair-style.ai/buzz-cut-filter',
    name: 'Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women',
    description:
      "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
    applicationCategory: 'WebApplication',
    operatingSystem: 'Windows, MacOS, Linux, ChromeOS, Android, iOS, iPadOS',
    brand: {
      '@type': 'Brand',
      name: 'AI Hairstyle Changer'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      ratingCount: '26155'
    }
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://hair-style.ai'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women',    
        item: 'https://hair-style.ai/buzz-cut-filter'
      }
    ]
  }

// AI Hairstyle 页面 metadata
export const metadata: Metadata = {
    title: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
    description: "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
    alternates: {
        canonical: 'https://hair-style.ai/buzz-cut-filter'
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
    openGraph: {
        title: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
        description: "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
        images: [
            {
                url: "https://hair-style.ai/images/buzzcutgirl.jpg",
                width: 1920,
                height: 1080,
                alt: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
                type: "image/jpeg"
            }
        ],
        siteName: "Hair-style.ai",
        locale: "en_US",
        type: "website",
        url: "https://hair-style.ai/buzz-cut-filter",
    },
    twitter: {
        card: "summary_large_image",
        site: "@hair_styleai",
        title: "Free Buzz Cut Filter Online Tool – Virtual Haircut Generator for Men & Women",
        description: "Wonder how you'd look with a buzz cut? Use our free AI buzz cut filter to transform your hairstyle in seconds. Try it risk-free with just one photo!",
        images: ["https://hair-style.ai/images/buzzcutman2.jpg"]
    },

}


export default function BuzzCutFilterPage() {
    return (
        <>        
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
        <PageContent /></>

    )
}