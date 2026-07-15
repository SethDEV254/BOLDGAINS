const { ethers } = require('hardhat');

async function main() {
  const network = await ethers.provider.getNetwork();
  const isTestnet = Number(network.chainId) === 97;
  const [deployer] = await ethers.getSigners();

  const operatorPk = process.env.OPERATOR_PRIVATE_KEY;
  if (!operatorPk) throw new Error('OPERATOR_PRIVATE_KEY env var is not set');
  const operatorAddress = new ethers.Wallet(operatorPk).address;

  console.log('Network :', isTestnet ? 'BSC Testnet' : 'BSC Mainnet');
  console.log('Deployer:', deployer.address);
  console.log('Operator:', operatorAddress);

  const bal = await ethers.provider.getBalance(deployer.address);
  console.log('Balance :', ethers.formatEther(bal), 'BNB');

  const Factory = await ethers.getContractFactory('BoldGainsWalletV2');
  const contract = await Factory.deploy(operatorAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\nBoldGainsWalletV2 deployed to:', address);
  console.log('\nAdd to .env / Vercel env:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log('\nVerify on BscScan:');
  console.log(`npx hardhat verify --network ${isTestnet ? 'bscTestnet' : 'bsc'} ${address} ${operatorAddress}`);
}

main().catch(err => { console.error(err); process.exit(1); });
