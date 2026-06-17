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
