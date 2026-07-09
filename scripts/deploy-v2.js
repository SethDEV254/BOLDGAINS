/**
 * Deploy BoldGainsWalletV2 to BSC Mainnet
 * Usage: node scripts/deploy-v2.js
 */
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error('DEPLOYER_PRIVATE_KEY not set in .env');

  const rpc = 'https://bsc-dataseed.binance.org/';
  const provider = new ethers.JsonRpcProvider(rpc);
  const deployer = new ethers.Wallet(pk, provider);

  const network = await provider.getNetwork();
  const balance = await provider.getBalance(deployer.address);

  console.log('Network  :', network.name, `(chainId ${network.chainId})`);
  console.log('Deployer :', deployer.address);
  console.log('Balance  :', ethers.formatEther(balance), 'BNB');

  if (network.chainId !== 56n) throw new Error('Not BSC Mainnet (chainId 56)');

  const artifactPath = path.join(
    __dirname, '../artifacts/contracts/BoldGainsWalletV2.sol/BoldGainsWalletV2.json'
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  // Operator = deployer for now; change via setOperator() after deployment
  const operatorAddress = deployer.address;

  console.log('\nDeploying BoldGainsWalletV2...');
  console.log('Operator :', operatorAddress);

  // Estimate gas with correct from address, then add 20% buffer
  const deployTx = await factory.getDeployTransaction(operatorAddress);
  deployTx.from = deployer.address;
  const estimated = await provider.estimateGas(deployTx);
  const gasLimit = (estimated * 120n) / 100n;
  console.log('Gas estimate:', estimated.toString(), '→ using:', gasLimit.toString());

  const contract = await factory.deploy(operatorAddress, { gasLimit });

  console.log('Tx hash  :', contract.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('\n✓ BoldGainsWalletV2 deployed to:', address);
  console.log('\nUpdate .env:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log('\nVerify on BscScan:');
  console.log(`npx hardhat verify --network bsc ${address} ${operatorAddress}`);
}

main().catch(err => { console.error(err); process.exit(1); });
