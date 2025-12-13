import { Inter } from 'next/font/google'
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Golf Tournament App',
  description: 'Official application for the Golf Tournament',
};

import Provider from '@/components/Provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <main className="container" style={{ flex: 1, padding: '2rem 20px' }}>
              {children}
            </main>
            <Footer />
          </div>
        </Provider>
      </body>
    </html>
  );
}
