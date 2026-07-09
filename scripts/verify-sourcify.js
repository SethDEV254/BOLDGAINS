/**
 * Verify BoldGainsWalletV2 on Sourcify (no API key required)
 * BSCScan automatically shows Sourcify-verified contracts.
 */
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONTRACT_ADDRESS = '0x6F33bb97f29eD302C0b3eAc24E82975B40c2fEe5';
const CHAIN_ID = '56'; // BSC Mainnet

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(opts, res => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(out) }); }
        catch { resolve({ status: res.statusCode, body: out }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Find the build-info that compiled BoldGainsWalletV2
  const buildInfoDir = path.join(__dirname, '../artifacts/build-info');
  const files = fs.readdirSync(buildInfoDir).filter(f => f.endsWith('.json'));

  let buildInfo = null;
  for (const file of files) {
    const info = JSON.parse(fs.readFileSync(path.join(buildInfoDir, file), 'utf8'));
    if (info.input?.sources?.['contracts/BoldGainsWalletV2.sol']) {
      buildInfo = info;
      break;
    }
  }
  if (!buildInfo) throw new Error('Build info not found. Re-compile first.');

  // Sourcify expects the standard JSON input + metadata
  const solcInput = buildInfo.input;
  const solcOutput = buildInfo.output;

  // Get the metadata from the compiler output
  const metadata = solcOutput?.contracts?.['contracts/BoldGainsWalletV2.sol']?.BoldGainsWalletV2?.metadata;
  if (!metadata) throw new Error('Metadata not found in build output');

  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

  // Build the files payload: metadata.json + all source files
  const sources = {};
  for (const [filePath, content] of Object.entries(solcInput.sources || {})) {
    sources[filePath] = content.content;
  }

  console.log('Submitting to Sourcify...');
  console.log('Contract :', CONTRACT_ADDRESS);
  console.log('Chain ID :', CHAIN_ID);
  console.log('Sources  :', Object.keys(sources).join(', '));

  const payload = {
    address: CONTRACT_ADDRESS,
    chain: CHAIN_ID,
    files: {
      'metadata.json': JSON.stringify(metadataObj),
      ...Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, v])),
    },
  };

  const res = await postJson('https://sourcify.dev/server/verify', payload);
  console.log('\nSourceify response:', JSON.stringify(res.body, null, 2));

  if (res.status === 200) {
    const match = res.body?.result?.[0]?.status;
    if (match === 'perfect' || match === 'partial') {
      console.log(`\n✓ Verified on Sourcify (${match} match)!`);
      console.log(`https://sourcify.dev/#/lookup/${CONTRACT_ADDRESS}`);
      console.log(`https://bscscan.com/address/${CONTRACT_ADDRESS}#code`);
    } else {
      console.log('\nResult:', res.body);
    }
  } else {
    console.error('\nFailed (HTTP', res.status + '):', res.body);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
