
import { Inter } from 'next/font/google'
import './globals.css';
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
    <html lang="en">
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
