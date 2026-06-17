import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '1aa495a5e6b880d8d9de74d69738b001';

export const networks = [bsc];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
