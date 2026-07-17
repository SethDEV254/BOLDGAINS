import type { NextConfig } from 'next';
import path from 'path';

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
  // Without this, Turbopack walks up to the nearest package-lock.json it finds — which on
  // this machine is C:\Users\PC, turning the whole home directory into the "project root"
  // it file-watches and resolves modules against, causing multi-minute compile hangs.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
