
import { Inter, Pinyon_Script } from 'next/font/google'
import './globals.css';
import Provider from '@/components/Provider';
import FloatingSignIn from '@/components/FloatingSignIn';

const pinyonScript = Pinyon_Script({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-brush',
  display: 'swap',
});

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
    <html lang="en" className={pinyonScript.variable}>
      <body>
        <Provider>
          {children}
          <FloatingSignIn />
        </Provider>
      </body>
    </html>
  );
}
