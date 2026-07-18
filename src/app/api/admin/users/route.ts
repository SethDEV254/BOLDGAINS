import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAllUsers, getSystemStats } from '@/lib/db';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rawUsers, rawStats, bnbPrice] = await Promise.all([getAllUsers(), getSystemStats(), getBnbPrice()]);

  const users = rawUsers.map((u: any) => ({
    ...u,
    wallet_balance: bnbToUsd(u.wallet_balance || 0, bnbPrice),
    total_earned: bnbToUsd(u.total_earned || 0, bnbPrice),
  }));
  const stats = {
    ...rawStats,
    totalVolume: bnbToUsd(rawStats.totalVolume, bnbPrice),
    totalEarnings: bnbToUsd(rawStats.totalEarnings, bnbPrice),
    pendingVolume: bnbToUsd(rawStats.pendingVolume, bnbPrice),
  };

  return NextResponse.json({ users, stats });
}
