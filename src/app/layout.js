
import { Inter } from 'next/font/google'
import './globals.css';
import Provider from '@/components/Provider';
import FloatingSignIn from '@/components/FloatingSignIn';

export const metadata = {
  title: 'Golf App',
  description: 'Manage your golf tournaments',
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
