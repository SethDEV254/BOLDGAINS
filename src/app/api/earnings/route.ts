import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserEarnings, getUserEarningsSummary, getUserById } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, earnings, summary] = await Promise.all([
    getUserById(session.userId),
    getUserEarnings(session.userId),
    getUserEarningsSummary(session.userId),
  ]);

  const summaryMap: Record<string, number> = {};
  for (const e of summary) summaryMap[e.type] = Number(e.total);

  return NextResponse.json({
    total: user?.total_earned || 0,
    summary: {
      upgrade_bonus: summaryMap['upgrade_bonus'] || 0,
      network_level: summaryMap['network_level'] || 0,
      leadership_pool: summaryMap['leadership_pool'] || 0,
      rank_pool: summaryMap['rank_pool'] || 0,
      product_reorder: summaryMap['product_reorder'] || 0,
    },
    history: earnings,
  });
}
