import './globals.css'


export const metadata = {
  icons: {
    icon: [
      {
        url: '/images/logo/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        url: '/images/logo/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/images/logo/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      }
    ],
    apple: [
      {
        url: '/images/logo/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    shortcut: [
      {
        url: '/images/logo/favicon.ico',
        type: 'image/x-icon'
      }
    ],
    maskIcon: {
      url: '/images/logo/safari-pinned-tab.svg',
      color: '#000000'
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
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
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
        <script async src="https://www.google.com/..."></script>
        <script async src="https://cse.google.com/..."></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
