import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllTransactions } from '@/lib/db';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rawTransactions, bnbPrice] = await Promise.all([getAllTransactions(200), getBnbPrice()]);
  const transactions = rawTransactions.map((t: any) => ({
    ...t,
    amount: bnbToUsd(t.amount, bnbPrice),
    net_amount: bnbToUsd(t.net_amount, bnbPrice),
  }));

  return NextResponse.json({ transactions });
}
