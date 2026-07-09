/**
 * Verify BoldGainsWalletV2 on BscScan
 */
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const CONTRACT_ADDRESS = '0x6F33bb97f29eD302C0b3eAc24E82975B40c2fEe5';
const OPERATOR_ADDRESS  = '0xAf6c12e51A09376F448F3301d027b6A7bd76962A';
const API_KEY           = process.env.BSCSCAN_API_KEY || '';
const COMPILER_VERSION  = 'v0.8.20+commit.a1b79de6';

function abiEncodeAddress(addr) {
  return addr.replace('0x', '').toLowerCase().padStart(64, '0');
}

// Etherscan V2 API — chainId 56 = BSC Mainnet
const V2_BASE = 'https://api.etherscan.io/v2/api?chainid=56';

function post(params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const url = new URL(V2_BASE);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(params) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams(params).toString();
    https.get(`${V2_BASE}&${qs}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const flatPath = path.join(__dirname, '../BoldGainsWalletV2-flat.sol');
  if (!fs.existsSync(flatPath)) throw new Error('Flattened source not found. Run hardhat flatten first.');

  let source = fs.readFileSync(flatPath, 'utf8');
  // Remove duplicate SPDX/pragma lines (hardhat flatten can add multiple)
  source = source
    .split('\n')
    .filter((line, i, arr) => {
      if (line.startsWith('// SPDX-License-Identifier:') || line.startsWith('pragma solidity')) {
        return arr.indexOf(line) === i;
      }
      return true;
    })
    .join('\n');

  const constructorArgs = abiEncodeAddress(OPERATOR_ADDRESS);

  console.log('Submitting verification to BscScan...');
  console.log('Contract :', CONTRACT_ADDRESS);
  console.log('Compiler :', COMPILER_VERSION);
  console.log('Ctor args:', constructorArgs);

  const res = await post({
    apikey:              API_KEY,
    module:              'contract',
    action:              'verifysourcecode',
    contractaddress:     CONTRACT_ADDRESS,
    sourceCode:          source,
    codeformat:          'solidity-single-file',
    contractname:        'BoldGainsWalletV2',
    compilerversion:     COMPILER_VERSION,
    optimizationUsed:    '1',
    runs:                '200',
    constructorArguements: constructorArgs,
    evmversion:          'paris',
    licenseType:         '3', // MIT
  });

  console.log('\nBscScan response:', JSON.stringify(res, null, 2));

  if (res.status !== '1') {
    console.error('\nVerification failed:', res.result);
    process.exit(1);
  }

  const guid = res.result;
  console.log('\nVerification submitted. GUID:', guid);
  console.log('Polling status...');

  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const check = await get({
      apikey:  API_KEY,
      module:  'contract',
      action:  'checkverifystatus',
      guid,
    });
    console.log(`[${i + 1}] ${check.result}`);
    if (check.result === 'Pass - Verified') {
      console.log('\n✓ Contract verified!');
      console.log(`https://bscscan.com/address/${CONTRACT_ADDRESS}#code`);
      return;
    }
    if (check.result?.startsWith('Fail')) {
      console.error('\nVerification failed:', check.result);
      process.exit(1);
    }
  }
  console.log('Timed out waiting. Check manually:');
  console.log(`https://bscscan.com/address/${CONTRACT_ADDRESS}#code`);
}

main().catch(err => { console.error(err); process.exit(1); });
