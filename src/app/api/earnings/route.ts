import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserEarnings, getUserEarningsSummary, getUserById } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUserById(session.userId);
  const earnings = getUserEarnings(session.userId);
  const summary = getUserEarningsSummary(session.userId);

  const summaryMap: Record<string, number> = {};
  for (const e of summary) summaryMap[e.type] = e.total;

  return NextResponse.json({
    total: user?.total_earned || 0,
    summary: {
      direct_bonus: summaryMap['direct_bonus'] || 0,
      upgrade_bonus: summaryMap['upgrade_bonus'] || 0,
      leadership_pool: summaryMap['leadership_pool'] || 0,
      network_level: summaryMap['network_level'] || 0,
      products: summaryMap['products'] || 0,
    },
    history: earnings,
  });
}
