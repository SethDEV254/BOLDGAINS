import { NextResponse } from 'next/server';
import { getTeamSession } from '@/lib/team-auth';
import { getAllTransactions, getSystemStats } from '@/lib/db';
import { getBnbPrice } from '@/lib/bnb-price';

async function getProvider() {
  const { JsonRpcProvider } = await import('ethers');
  const { BSC_RPC_LIST } = await import('@/lib/contract');
  for (const url of BSC_RPC_LIST) {
    try {
      const p = new JsonRpcProvider(url);
      await p.getBlockNumber();
      return p;
    } catch {}
  }
  throw new Error('All BSC RPC endpoints failed');
}

export async function GET() {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { Wallet, Contract, formatEther } = await import('ethers');
    const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('@/lib/contract');

    const [stats, allTxs, bnbPrice] = await Promise.all([
      getSystemStats(),
      getAllTransactions(500),
      getBnbPrice(),
    ]);

    // "Contract Balance" here is never the real on-chain balance — it's total
    // platform volume minus total member earnings, computed live from our own
    // ledger, so this panel never touches the real treasury figure.
    const fakeBalanceBnb = Math.max(stats.totalVolume - stats.totalEarnings, 0);

    const pendingWithdrawals = (allTxs as any[])
      .filter(t => t.type === 'withdrawal' && t.status === 'pending')
      .map(({ reference, ...rest }: any) => rest);

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json({
        contractAddress: '', balance: fakeBalanceBnb.toFixed(8), availableBalance: '0',
        accumulatedFees: '0', hasOperator: false, paused: false, pendingWithdrawals, bnbPrice,
      });
    }

    const provider = await getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const [availWei, feesWei, isPaused] = await Promise.all([
      contract.availableBalance().catch(() => BigInt(0)),
      contract.accumulatedFees().catch(() => BigInt(0)),
      contract.paused().catch(() => false),
    ]);

    const opPk = process.env.OPERATOR_PRIVATE_KEY;
    const operatorAddress = opPk ? new Wallet(opPk).address : '';

    return NextResponse.json({
      contractAddress: CONTRACT_ADDRESS,
      balance: fakeBalanceBnb.toFixed(8),
      availableBalance: formatEther(availWei),
      accumulatedFees: formatEther(feesWei),
      operatorAddress,
      hasOperator: !!opPk,
      paused: isPaused,
      pendingWithdrawals,
      bnbPrice,
    });
  } catch (e: any) {
    const msg = e?.message || e?.toString() || 'Unknown error';
    console.error('[team/contract]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
