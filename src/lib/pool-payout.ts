import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import { BSC_RPC, CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';

const POOL_ADDRESSES = {
  leadership:   process.env.LEADERSHIP_POOL_ADDRESS!,
  rank:         process.env.RANK_POOL_ADDRESS!,
  products:     process.env.PRODUCTS_POOL_ADDRESS!,
  registration: process.env.REGISTRATION_FEE_ADDRESS!,
};

function getSigner() {
  const pk = process.env.OPERATOR_PRIVATE_KEY;
  if (!pk) throw new Error('OPERATOR_PRIVATE_KEY not set');
  const provider = new JsonRpcProvider(BSC_RPC);
  return new Wallet(pk, provider);
}

export async function sendToPool(
  poolName: keyof typeof POOL_ADDRESSES,
  amountBnb: number,
  ref: string,
): Promise<string | null> {
  if (!amountBnb || isNaN(amountBnb) || amountBnb <= 0) return null;

  const address = POOL_ADDRESSES[poolName];
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    console.error(`[pool-payout] invalid address for ${poolName}: ${address}`);
    return null;
  }

  try {
    const signer   = getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const amountWei = parseUnits(amountBnb.toFixed(8), 18);
    const tx = await contract['productAcquisition(address,uint256,string)'](address, amountWei, ref);
    await tx.wait();
    return tx.hash as string;
  } catch (err) {
    console.error(`[pool-payout] failed to send ${amountBnb} BNB to ${poolName}:`, err);
    return null;
  }
}

export async function distributePoolSplit(
  grossBnb: number,
  leadershipRate: number,
  rankRate: number,
  ref: string,
) {
  const leadership = grossBnb * leadershipRate;
  const rank       = grossBnb * rankRate;

  // Sequential — parallel calls from the same wallet cause nonce conflicts
  const lTx = await sendToPool('leadership', leadership, `${ref}-leadership`);
  const rTx = await sendToPool('rank',       rank,       `${ref}-rank`);

  return { leadership, rank, leadershipTx: lTx, rankTx: rTx };
}
