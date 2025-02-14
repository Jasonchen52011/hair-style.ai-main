import './globals.css'
import Script from 'next/script'
import { baseMetadata } from './metadata'

// 导出 metadata 配置
export const metadata = baseMetadata

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
