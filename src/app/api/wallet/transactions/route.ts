import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserTransactions, getUserById } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, transactions] = await Promise.all([
    getUserById(session.userId),
    getUserTransactions(session.userId, 50),
  ]);

  return NextResponse.json({ balance: user?.wallet_balance || 0, transactions });
}
