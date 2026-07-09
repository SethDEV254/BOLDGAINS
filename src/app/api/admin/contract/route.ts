import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllTransactions, approveWithdrawal, rejectWithdrawal, getUserById } from '@/lib/db';

async function guard() {
  const s = await getSession();
  if (!s || s.role !== 'admin') return null;
  return s;
}

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
  const session = await guard();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { Wallet, Contract, formatEther } = await import('ethers');
    const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('@/lib/contract');

    if (!CONTRACT_ADDRESS)
      return NextResponse.json({ contractAddress: '', balance: '0', availableBalance: '0', hasOperator: false, paused: false });

    const provider = await getProvider();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const [balWei, availWei, isPaused, chainId, allTxs] = await Promise.all([
      provider.getBalance(CONTRACT_ADDRESS),
      contract.availableBalance().catch(() => BigInt(0)),
      contract.paused().catch(() => false),
      provider.getNetwork().then(n => n.chainId),
      getAllTransactions(500),
    ]);

    const pk = process.env.OPERATOR_PRIVATE_KEY;
    const operatorAddress = pk ? new Wallet(pk).address : '';

    const pendingWithdrawals = (allTxs as any[]).filter(
      t => t.type === 'withdrawal' && t.status === 'pending',
    );

    return NextResponse.json({
      contractAddress: CONTRACT_ADDRESS,
      balance: formatEther(balWei),
      availableBalance: formatEther(availWei),
      operatorAddress,
      hasOperator: !!pk,
      paused: isPaused,
      chainId: Number(chainId),
      pendingWithdrawals,
    });
  } catch (e: any) {
    const msg = e?.message || e?.toString() || 'Unknown error';
    console.error('[contract GET]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await guard();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { action, txId, to, amount } = body;

  const pk = process.env.OPERATOR_PRIVATE_KEY;
  if (!pk) return NextResponse.json({ error: 'OPERATOR_PRIVATE_KEY not set' }, { status: 500 });

  try {
    const { Wallet, Contract, parseEther, formatEther } = await import('ethers');
    const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('@/lib/contract');

    const provider = await getProvider();
    const signer = new Wallet(pk, provider);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    if (action === 'pause') {
      const tx = await contract.pause();
      const receipt = await tx.wait();
      return NextResponse.json({ success: true, txHash: receipt.hash });
    }

    if (action === 'unpause') {
      const tx = await contract.unpause();
      const receipt = await tx.wait();
      return NextResponse.json({ success: true, txHash: receipt.hash });
    }

    if (action === 'collectFees') {
      const tx = await contract.collectFees();
      const receipt = await tx.wait();
      return NextResponse.json({ success: true, txHash: receipt.hash });
    }

    if (action === 'emergencyWithdraw') {
      const tx = await contract.emergencyWithdraw();
      const receipt = await tx.wait();
      return NextResponse.json({ success: true, txHash: receipt.hash });
    }

    if (action === 'approveWithdrawal' && txId) {
      const allTxs = await getAllTransactions(500);
      const withdrawal = (allTxs as any[]).find(t => t.id === txId);
      if (!withdrawal) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

      const user = await getUserById(withdrawal.user_id);
      const bscAddress = withdrawal.reference || user?.bsc_address;
      if (!bscAddress || !/^0x[0-9a-fA-F]{40}$/.test(bscAddress))
        return NextResponse.json({ error: 'No valid BSC address for this user' }, { status: 400 });

      const amountWei = parseEther(parseFloat(withdrawal.net_amount).toFixed(8));
      const available = await contract.availableBalance().catch(() => BigInt(0));
      if (available < amountWei)
        return NextResponse.json({
          error: `Insufficient contract balance. Available: ${parseFloat(formatEther(available)).toFixed(4)} BNB. Fund the contract first.`,
        }, { status: 400 });
      const tx = await contract.processWithdrawal(bscAddress, amountWei, txId.toString());
      const receipt = await tx.wait();
      await approveWithdrawal(txId);
      return NextResponse.json({ success: true, txHash: receipt.hash });
    }

    if (action === 'rejectWithdrawal' && txId) {
      await rejectWithdrawal(txId);
      return NextResponse.json({ success: true });
    }

    if (action === 'manualSend' && to && amount) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(to))
        return NextResponse.json({ error: 'Invalid BSC address' }, { status: 400 });
      const amountWei = parseEther(parseFloat(amount).toFixed(8));
      const available = await contract.availableBalance().catch(() => BigInt(0));
      if (available < amountWei)
        return NextResponse.json({
          error: `Insufficient contract balance. Available: ${parseFloat(formatEther(available)).toFixed(4)} BNB, requested: ${amount} BNB. Fund the contract first.`,
        }, { status: 400 });
      const tx = await contract.processWithdrawal(to, amountWei, 'manual-admin');
      const receipt = await tx.wait();
      return NextResponse.json({ success: true, txHash: receipt.hash });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    const msg = e?.message || e?.toString() || 'Unknown error';
    console.error('[contract POST]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
