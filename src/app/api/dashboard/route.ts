import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, getUserEarningsSummary, getUserTransactions, getNetworkStats, getDirectDownlines } from '@/lib/db';
import { getPackageByLevel } from '@/lib/packages';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, earningsSummary, recentTransactions, networkStats, directDownlines] = await Promise.all([
    getUserById(session.userId),
    getUserEarningsSummary(session.userId),
    getUserTransactions(session.userId, 5),
    getNetworkStats(session.userId),
    getDirectDownlines(session.userId),
  ]);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const pkg = getPackageByLevel(user.package_level);

  const earningsMap: Record<string, number> = {};
  for (const e of earningsSummary) earningsMap[e.type] = Number(e.total);

  return NextResponse.json({
    user: {
      id: user.id, name: user.name, email: user.email,
      referralCode: user.referral_code, bscAddress: user.bsc_address,
      packageLevel: user.package_level,
      walletBalance: user.wallet_balance, totalEarned: user.total_earned,
      role: user.role, createdAt: user.created_at,
    },
    package: pkg,
    earnings: {
      upgradeBonus: earningsMap['upgrade_bonus'] || 0,
      networkLevel: earningsMap['network_level'] || 0,
      leadershipPool: earningsMap['leadership_pool'] || 0,
      rankPool: earningsMap['rank_pool'] || 0,
      productReorder: earningsMap['product_reorder'] || 0,
      total: user.total_earned,
    },
    network: networkStats,
    recentTransactions,
    directDownlines: directDownlines.slice(0, 5),
  });
}
