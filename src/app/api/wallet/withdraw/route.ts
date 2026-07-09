import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, updateWalletBalance, createTransaction, completeTransaction, failTransaction } from '@/lib/db';
import { BONUS_RATES, MIN_WITHDRAWAL_NET_USD } from '@/lib/packages';
import { getBnbPrice } from '@/lib/bnb-price';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, walletAddress } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress))
    return NextResponse.json({ error: 'Valid BSC wallet address is required' }, { status: 400 });

  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.wallet_balance < amount)
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  const fee = amount * BONUS_RATES.management_fee_withdrawal;
  const net = amount - fee;

  const bnbPrice = await getBnbPrice();
  const netUsd = net * bnbPrice;
  if (netUsd < MIN_WITHDRAWAL_NET_USD)
    return NextResponse.json({
      error: `Minimum withdrawal net is $${MIN_WITHDRAWAL_NET_USD} USD. Your net would be $${netUsd.toFixed(2)} USD.`,
    }, { status: 400 });

  await updateWalletBalance(session.userId, -amount);

  const txId = await createTransaction({
    userId: session.userId, type: 'withdrawal',
    amount, fee, netAmount: net,
    description: `Withdrawal to ${walletAddress}`,
    reference: undefined,
    status: 'pending',
  });

  // Fire-and-forget on-chain transfer — sequential with other operator txs
  const netAmount = net;
  const ref = `withdraw-${txId}`;
  (async () => {
    try {
      const { JsonRpcProvider, Wallet, Contract, parseUnits } = await import('ethers');
      const { BSC_RPC, CONTRACT_ADDRESS, CONTRACT_ABI } = await import('@/lib/contract');

      const pk = process.env.OPERATOR_PRIVATE_KEY;
      if (!pk) throw new Error('OPERATOR_PRIVATE_KEY not set');

      const provider = new JsonRpcProvider(BSC_RPC);
      const signer = new Wallet(pk, provider);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const amountWei = parseUnits(netAmount.toFixed(8), 18);

      const tx = await contract.processWithdrawal(walletAddress, amountWei, ref);
      await tx.wait();
      await completeTransaction(txId, tx.hash);
    } catch (err) {
      console.error('[withdraw] on-chain transfer failed:', err);
      await failTransaction(txId);
      // Refund balance on failure
      await updateWalletBalance(session.userId, amount);
    }
  })();

  return NextResponse.json({ success: true, amount, fee, net });
}
