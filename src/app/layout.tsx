import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import './globals.css';
import PrismStars from '@/components/prism-stars';
import { Web3Provider } from '@/components/web3-provider';
import { wagmiConfig } from '@/lib/web3modal';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'BOLD GAINS — Build Your Empire',
  description: 'Premium network marketing platform. Earn, grow, and succeed with Bold Gains.',
  icons: { icon: '/logo.jpeg' },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get('cookie'));

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased" style={{ background: '#000000', color: '#f0f0f0' }}>
        <Web3Provider initialState={initialState}>
          <PrismStars />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
