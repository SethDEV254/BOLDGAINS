import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import PrismStars from '@/components/prism-stars';
import { Web3Provider } from '@/components/web3-provider';

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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Warm up the wallet-connect modal's external hosts (wallet list, icons, fonts)
            ahead of the click, instead of paying full DNS+TLS handshake cost then. */}
        <link rel="preconnect" href="https://api.web3modal.org" />
        <link rel="preconnect" href="https://fonts.reown.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.web3modal.org" />
        <link rel="dns-prefetch" href="https://fonts.reown.com" />
      </head>
      <body className="min-h-screen antialiased" style={{ background: '#000000', color: '#f0f0f0' }}>
        <Web3Provider>
          <PrismStars />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
