import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@reown/appkit',
    '@reown/appkit-adapter-wagmi',
    '@walletconnect/ethereum-provider',
    '@walletconnect/universal-provider',
    '@walletconnect/sign-client',
    '@walletconnect/utils',
    '@wagmi/connectors',
    '@wagmi/core',
  ],
  turbopack: {},
};

export default nextConfig;
