import { ethers } from 'hardhat';

async function main() {
  const network = await ethers.provider.getNetwork();
  const isTestnet = network.chainId === 97n;
  const [deployer] = await ethers.getSigners();

  const operatorAddress = process.env.OPERATOR_ADDRESS || deployer.address;

  console.log('Network  :', isTestnet ? 'BSC Testnet' : 'BSC Mainnet');
  console.log('Deployer :', deployer.address);
  console.log('Operator :', operatorAddress);

  const Factory = await ethers.getContractFactory('BoldGainsWalletV2');
  const contract = await Factory.deploy(operatorAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\nBoldGainsWalletV2 deployed to:', address);
  console.log('\nAdd to .env:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log('\nVerify on BscScan:');
  console.log(`npx hardhat verify --network ${isTestnet ? 'bscTestnet' : 'bsc'} ${address} ${operatorAddress}`);
}

main().catch(err => { console.error(err); process.exit(1); });
