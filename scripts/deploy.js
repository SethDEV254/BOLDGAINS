const { ethers } = require('hardhat');

async function main() {
  const network = await ethers.provider.getNetwork();
  const isTestnet = Number(network.chainId) === 97;
  const [deployer] = await ethers.getSigners();

  console.log('Network :', isTestnet ? 'BSC Testnet' : 'BSC Mainnet');
  console.log('Deployer:', deployer.address);

  const bal = await ethers.provider.getBalance(deployer.address);
  console.log('Balance :', ethers.formatEther(bal), 'BNB');

  const Factory = await ethers.getContractFactory('BoldGainsWallet');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\nBoldGainsWallet deployed to:', address);
  console.log('\nAdd to Vercel env:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`OPERATOR_PRIVATE_KEY=<your-operator-key>`);
  console.log('\nVerify on BscScan:');
  console.log(`npx hardhat verify --network ${isTestnet ? 'bscTestnet' : 'bsc'} ${address}`);
}

main().catch(err => { console.error(err); process.exit(1); });
