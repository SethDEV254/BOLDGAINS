import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserEarnings, getUserEarningsSummary, getUserById } from '@/lib/db';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, earnings, summary, bnbPrice] = await Promise.all([
    getUserById(session.userId),
    getUserEarnings(session.userId),
    getUserEarningsSummary(session.userId),
    getBnbPrice(),
  ]);

  const usd = (bnb: number) => bnbToUsd(bnb, bnbPrice);

  const summaryMap: Record<string, number> = {};
  for (const e of summary) summaryMap[e.type] = Number(e.total);

  return NextResponse.json({
    total: usd(user?.total_earned || 0),
    summary: {
      upgrade_bonus: usd(summaryMap['upgrade_bonus'] || 0),
      network_level: usd(summaryMap['network_level'] || 0),
      leadership_pool: usd(summaryMap['leadership_pool'] || 0),
      rank_pool: usd(summaryMap['rank_pool'] || 0),
      product_reorder: usd(summaryMap['product_reorder'] || 0),
      referral_direct: usd(summaryMap['referral_direct'] || 0),
      referral_indirect: usd(summaryMap['referral_indirect'] || 0),
      referral_bonus: usd(summaryMap['referral_bonus'] || 0),
    },
    history: earnings.map((e: any) => ({ ...e, amount: usd(e.amount) })),
  });
}
