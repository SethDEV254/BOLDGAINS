import { NextResponse } from 'next/server';
import { getTeamSession } from '@/lib/team-auth';
import { getAllTransactions } from '@/lib/db';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rawTransactions, bnbPrice] = await Promise.all([getAllTransactions(200), getBnbPrice()]);
  // `reference` holds destination wallet addresses for withdrawals — admin-only, stripped here.
  const transactions = rawTransactions.map((t: any) => {
    const { reference, ...rest } = t;
    return {
      ...rest,
      amount: bnbToUsd(t.amount, bnbPrice),
      net_amount: bnbToUsd(t.net_amount, bnbPrice),
    };
  });

  return NextResponse.json({ transactions });
}
