import './globals.css'



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
      <script
        id="clarity-script"
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "r341ayxao1");`
        }}
      />
        <link rel="icon" href="/favicon.ico" sizes="any" />
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
