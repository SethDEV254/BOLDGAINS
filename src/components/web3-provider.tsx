'use client';

import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ReactNode } from 'react';
import { projectId, networks, wagmiAdapter, wagmiConfig } from '@/lib/web3modal';

const origin = typeof window !== 'undefined' ? window.location.origin : 'https://boldgains.net';

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as any,
  defaultNetwork: networks[0],
  // AppKit's own "Switch Network" modal blocks the whole screen and, on some
  // in-app mobile wallet browsers, the switch request inside it never resolves
  // — leaving no way out but Disconnect. Letting the connection through on any
  // chain means our own in-page wrong-chain UI (use-wallet's isWrongChain +
  // the login page's Switch to BNB Smart Chain button, which has a timeout
  // and doesn't depend on this modal) is what the user actually sees.
  allowUnsupportedChain: true,
  metadata: {
    name: 'Bold Gains',
    description: 'Build Your Empire — Premium MLM Platform on BSC',
    url: origin,
    icons: [`${origin}/logo.jpeg`],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FF8C00',
    '--w3m-border-radius-master': '12px',
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
  // Email/social login, swaps, onramp & analytics each load extra iframes/requests
  // on modal open — off since this is a wallet-only BSC connect flow.
  features: {
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
    analytics: false,
    legalCheckbox: false,
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
