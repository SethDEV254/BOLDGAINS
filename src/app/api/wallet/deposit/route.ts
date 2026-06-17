import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateWalletBalance, createTransaction, getTransactionByReference } from '@/lib/db';
import { BONUS_RATES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, reference, txHash } = await req.json();

  if (txHash) {
    if (typeof txHash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(txHash))
      return NextResponse.json({ error: 'Invalid tx hash' }, { status: 400 });

    if (await getTransactionByReference(txHash))
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 409 });

    try {
      const { JsonRpcProvider, Interface, formatUnits } = await import('ethers');
      const { BSC_RPC, CONTRACT_ADDRESS, CONTRACT_ABI } = await import('@/lib/contract');

      const provider = new JsonRpcProvider(BSC_RPC);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) return NextResponse.json({ error: 'Transaction not found on BSC' }, { status: 400 });
      if (receipt.status === 0) return NextResponse.json({ error: 'Transaction reverted on-chain' }, { status: 400 });
      if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase())
        return NextResponse.json({ error: 'Transaction sent to wrong contract' }, { status: 400 });

      const iface = new Interface(CONTRACT_ABI);
      let depositLog: any = null;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsed?.name === 'Deposited') { depositLog = parsed; break; }
        } catch {}
      }

      if (!depositLog) return NextResponse.json({ error: 'Deposit event not found in transaction' }, { status: 400 });

      if (depositLog.args.userId !== session.userId.toString())
        return NextResponse.json({ error: 'User ID mismatch in transaction' }, { status: 403 });

      const gross = parseFloat(formatUnits(depositLog.args.gross, 18));
      const fee   = parseFloat(formatUnits(depositLog.args.fee,   18));
      const net   = parseFloat(formatUnits(depositLog.args.net,   18));

      await createTransaction({
        userId: session.userId, type: 'deposit',
        amount: gross, fee, netAmount: net,
        description: 'On-chain BNB deposit (BSC)',
        reference: txHash,
      });
      await updateWalletBalance(session.userId, net);

      return NextResponse.json({ success: true, amount: gross, fee, net, onChain: true });
    } catch (err) {
      console.error('[deposit verify]', err);
      return NextResponse.json({ error: 'Failed to verify on-chain transaction' }, { status: 500 });
    }
  }

  // Manual / off-chain deposit
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const fee = amount * BONUS_RATES.management_fee_deposit;
  const net = amount - fee;

  await createTransaction({
    userId: session.userId, type: 'deposit', amount, fee, netAmount: net,
    description: 'Manual deposit', reference: reference || undefined,
  });
  await updateWalletBalance(session.userId, net);

  return NextResponse.json({ success: true, amount, fee, net, onChain: false });
}
