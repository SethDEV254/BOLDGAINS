import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, updateWalletBalance, createTransaction } from '@/lib/db';
import { BONUS_RATES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, walletAddress } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  if (walletAddress && !/^0x[0-9a-fA-F]{40}$/.test(walletAddress))
    return NextResponse.json({ error: 'Invalid BSC wallet address' }, { status: 400 });

  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.wallet_balance < amount)
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  const fee = amount * BONUS_RATES.management_fee_withdrawal;
  const net = amount - fee;

  await updateWalletBalance(session.userId, -amount);

  await createTransaction({
    userId: session.userId, type: 'withdrawal',
    amount, fee, netAmount: net,
    description: walletAddress ? `Withdrawal to ${walletAddress}` : 'Wallet withdrawal',
    reference: walletAddress || undefined,
    status: 'pending',
  });

  return NextResponse.json({ success: true, amount, fee, net });
}
