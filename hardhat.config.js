// Minimal config for compilation — no toolbox required
require('dotenv').config();

const pk = process.env.DEPLOYER_PRIVATE_KEY;

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97,
      accounts: pk ? [pk] : [],
    },
    bsc: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      accounts: pk ? [pk] : [],
    },
  },
  etherscan: {
    apiKey: { bsc: process.env.BSCSCAN_API_KEY || '' },
    customChains: [
      {
        network: 'bsc',
        chainId: 56,
        urls: {
          apiURL: 'https://api.bscscan.com/api',
          browserURL: 'https://bscscan.com',
        },
      },
    ],
  },
};
