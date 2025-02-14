import './globals.css'
import { Metadata } from 'next' 
import Script from 'next/script'

export const metadata: Metadata = {
  metadataBase: new URL('https://hair-style.ai'),
  title: 'Hair-style.ai - AI Hairstyle Changer',
  description: 'Transform your look with Hair-style.ai\'s free AI hairstyle changer. Try different hairstyles instantly, visualize your new look.',
  robots: 'index,follow',
  alternates: {
    canonical: 'https://hair-style.ai',
  },
  verification: {
    other: {
      'msvalidate.01': '518A1A066EA7B7ED31AA7B89CDC8BC86',
    },
  },
  icons: {
    icon: [
      {
        url: '/images/logo/favicon.ico',
        type: 'image/x-icon',
        sizes: 'any'
      }
    ],
    apple: {
      url: '/images/logo/logo-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/images/logo/logo-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/images/logo/logo-512x512.png',
      }
    ]
  },
  openGraph: {
    type: 'website',
    url: 'https://hair-style.ai',
    title: 'Hair-style.ai - AI Hairstyle Changer',
    description: 'Try different hairstyles instantly with AI. Change your look virtually before making a real change.',
    siteName: 'Hair-style.ai',
    images: [
      {
        url: '/images/hero/ba3.jpg',
        width: 1200,
        height: 630,
        alt: 'Before and after comparison of AI hairstyle transformation',
        type: 'image/jpeg',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hair-style.ai - AI Hairstyle Changer',
    description: 'Try different hairstyles instantly with AI. Change your look virtually before making a real change.',
    images: ['/images/hero/ba3.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'url': 'https://hair-style.ai',
    'logo': 'https://hair-style.ai/images/logo/logo-512x512.png',
    'name': 'Hair-style.ai',
    'image': 'https://hair-style.ai/images/hero/ba3.jpg',
    'description': 'AI Hairstyle Changer - Try different hairstyles instantly with AI',
    'sameAs': [
      'https://x.com/hair_styleai'
    ],
    'brand': {
      '@type': 'Brand',
      'name': 'Hair-style.ai',
      'logo': 'https://hair-style.ai/images/logo/logo-512x512.png'
    }
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Analytics 跟踪代码 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-SQ0ZZ6EFP6"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-SQ0ZZ6EFP6');
            `,
          }}
        />
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
          }}
        />
        <script async src="https://www.google.com/..."></script>
        <script async src="https://cse.google.com/..."></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
