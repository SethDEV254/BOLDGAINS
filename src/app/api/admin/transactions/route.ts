import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAllTransactions } from '@/lib/db';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const [session, rawTransactions, bnbPrice] = await Promise.all([
    requireAdmin(), getAllTransactions(200), getBnbPrice(),
  ]);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const transactions = rawTransactions.map((t: any) => ({
    ...t,
    amount: bnbToUsd(t.amount, bnbPrice),
    net_amount: bnbToUsd(t.net_amount, bnbPrice),
  }));

  return NextResponse.json({ transactions });
}
