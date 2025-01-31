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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="alternate" href="https://hair-style.ai" hrefLang="x-default" />
        <link rel="alternate" href="https://hair-style.ai/en" hrefLang="en" />
        <link rel="alternate" href="https://hair-style.ai/zh" hrefLang="zh" />
      </head>
      <body className="min-h-screen bg-white">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
