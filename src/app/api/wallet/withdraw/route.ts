import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, updateWalletBalance, createTransaction } from '@/lib/db';
import { BONUS_RATES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const user = getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const fee = amount * BONUS_RATES.management_fee_withdrawal;
  const net = amount - fee;

  if (user.wallet_balance < amount)
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  createTransaction({
    userId: session.userId, type: 'withdrawal', amount, fee, netAmount: net,
    description: 'Wallet withdrawal',
  });

  updateWalletBalance(session.userId, -amount);

  return NextResponse.json({ success: true, amount, fee, net });
}
