
import { Inter } from 'next/font/google'
import './globals.css';
import Provider from '@/components/Provider';
import FloatingSignIn from '@/components/FloatingSignIn';

export const metadata = {
  title: 'PinPlaced',
  description: 'Manage your golf tournaments',
  icons: {
    icon: '/images/logo_icon.png',
    apple: '/images/logo_icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          {children}
          <FloatingSignIn />
        </Provider>
      </body>
    </html>
  );
}
