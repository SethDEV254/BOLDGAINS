import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, getUserEarningsSummary, getUserTransactions, getNetworkStats, getDirectDownlines } from '@/lib/db';
import { getPackageByLevel } from '@/lib/packages';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, earningsSummary, recentTransactions, networkStats, directDownlines, bnbPrice] = await Promise.all([
    getUserById(session.userId),
    getUserEarningsSummary(session.userId),
    getUserTransactions(session.userId, 5),
    getNetworkStats(session.userId),
    getDirectDownlines(session.userId),
    getBnbPrice(),
  ]);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const pkg = getPackageByLevel(user.package_level);
  const usd = (bnb: number) => bnbToUsd(bnb, bnbPrice);

  const earningsMap: Record<string, number> = {};
  for (const e of earningsSummary) earningsMap[e.type] = Number(e.total);

  return NextResponse.json({
    user: {
      id: user.id, name: user.name, email: user.email,
      bscAddress: user.bsc_address,
      packageLevel: user.package_level,
      walletBalance: usd(user.wallet_balance), totalEarned: usd(user.total_earned),
      role: user.role, createdAt: user.created_at,
    },
    package: pkg,
    earnings: {
      upgradeBonus: usd(earningsMap['upgrade_bonus'] || 0),
      networkLevel: usd(earningsMap['network_level'] || 0),
      leadershipPool: usd(earningsMap['leadership_pool'] || 0),
      rankPool: usd(earningsMap['rank_pool'] || 0),
      productReorder: usd(earningsMap['product_reorder'] || 0),
      referralDirect: usd(earningsMap['referral_direct'] || 0),
      referralIndirect: usd(earningsMap['referral_indirect'] || 0),
      referralLegacy: usd(earningsMap['referral_bonus'] || 0),
      total: usd(user.total_earned),
    },
    network: networkStats,
    recentTransactions: (recentTransactions as any[]).map(t => ({ ...t, amount: usd(t.amount), net_amount: usd(t.net_amount) })),
    directDownlines: (directDownlines as any[]).slice(0, 5).map(d => ({ ...d, total_earned: usd(d.total_earned) })),
  });
}
