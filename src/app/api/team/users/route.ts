import { NextResponse } from 'next/server';
import { getTeamSession } from '@/lib/team-auth';
import { getAllUsers, getSystemStats } from '@/lib/db';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rawUsers, rawStats, bnbPrice] = await Promise.all([getAllUsers(), getSystemStats(), getBnbPrice()]);

  // Wallet addresses and credentials stay admin-only — team view never sees them, even in the raw response.
  const users = rawUsers.map((u: any) => {
    const { bsc_address, password_hash, ...rest } = u;
    return {
      ...rest,
      wallet_balance: bnbToUsd(u.wallet_balance || 0, bnbPrice),
      total_earned: bnbToUsd(u.total_earned || 0, bnbPrice),
    };
  });
  const stats = {
    ...rawStats,
    totalVolume: bnbToUsd(rawStats.totalVolume, bnbPrice),
    totalEarnings: bnbToUsd(rawStats.totalEarnings, bnbPrice),
    pendingVolume: bnbToUsd(rawStats.pendingVolume, bnbPrice),
  };

  return NextResponse.json({ users, stats });
}
