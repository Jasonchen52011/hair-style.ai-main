import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://hair-style.ai'),
  title: 'Hair-style.ai - AI Hairstyle Changer',
  description: 'Try different hairstyles instantly with AI. Change your look virtually before making a real change.',
  robots: 'index,follow',
  alternates: {
    canonical: '/',
    languages: {
      'x-default': 'https://hair-style.ai',
      'en': 'https://hair-style.ai/en',
      'zh': 'https://hair-style.ai/zh',
    }
  },
  verification: {
    other: {
      'msvalidate.01': '518A1A066EA7B7ED31AA7B89CDC8BC86',
    },
  },
  icons: {
    icon: '/images/logo/favicon.ico',
    apple: {
      url: '/images/logo/logo-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    shortcut: [
      { url: '/images/logo/favicon.ico' }
    ],
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
    images: [
      {
        url: '/images/logo/logo-512x512.png',
        width: 512,
        height: 512,
        alt: 'Hair-style.ai Logo'
      }
    ]
  }
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
    'image': 'https://hair-style.ai/images/logo/logo-512x512.png',
    'description': 'AI Hairstyle Changer - Try different hairstyles instantly with AI',
    'sameAs': [
      'https://facebook.com/hairstyleai',
      'https://twitter.com/hairstyleai',
      'https://instagram.com/hairstyleai'
    ]
  };

  return (
    <html lang="en">
      <head>

        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <link rel="alternate" href="https://hair-style.ai" hrefLang="x-default" />
        <link rel="alternate" href="https://hair-style.ai/en" hrefLang="en" />
        <link rel="alternate" href="https://hair-style.ai/zh" hrefLang="zh" />
      </head>
      <body>{children}</body>
    </html>
  )
}
