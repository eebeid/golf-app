import { Inter, Bodoni_Moda } from 'next/font/google'
import './globals.css';

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni',
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
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
