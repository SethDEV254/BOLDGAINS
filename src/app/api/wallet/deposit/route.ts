import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateWalletBalance, createTransaction } from '@/lib/db';
import { BONUS_RATES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, reference } = await req.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const fee = amount * BONUS_RATES.management_fee_deposit;
  const net = amount - fee;

  createTransaction({
    userId: session.userId, type: 'deposit', amount, fee, netAmount: net,
    description: 'Wallet deposit', reference: reference || undefined,
  });

  updateWalletBalance(session.userId, net);

  return NextResponse.json({ success: true, amount, fee, net });
}
