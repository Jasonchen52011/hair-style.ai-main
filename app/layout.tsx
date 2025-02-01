import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://hair-style.ai'),
  title: 'Hair-style.ai - AI Hairstyle Changer',
  description: 'Try different hairstyles instantly with AI. Change your look virtually before making a real change.',
  alternates: {
    canonical: '/',
    languages: {
      'x-default': 'https://hair-style.ai',
      'en': 'https://hair-style.ai/en',
      'zh': 'https://hair-style.ai/zh',
    }
  },
  icons: {
    icon: '/images/logo/favicon.ico',
    apple: '/images/logo/logo-192x192.png',
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
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" href="https://hair-style.ai" hrefLang="x-default" />
        <link rel="alternate" href="https://hair-style.ai/en" hrefLang="en" />
        <link rel="alternate" href="https://hair-style.ai/zh" hrefLang="zh" />
      </head>
      <body>{children}</body>
    </html>
  )
}
