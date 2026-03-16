import { Inter, Bodoni_Moda } from 'next/font/google'
import Script from 'next/script'
import './globals.css';

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni',
  display: 'swap',
});
import Provider from '@/components/Provider';



export const metadata = {
  title: 'PinPlaced',
  description: 'Manage your golf tournaments',
  icons: {
    icon: '/images/pinplaced_primary_logo_transparent.png',
    apple: '/images/pinplaced_primary_logo_transparent.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 0.75,
  minimumScale: 0.5,
  maximumScale: 3,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bodoni.variable}>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
