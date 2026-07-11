import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc } from '@reown/appkit/networks';
import { cookieStorage, createStorage } from 'wagmi';

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

export const networks = [bsc];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
