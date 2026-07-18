import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getGrowthData, getSystemStats } from '@/lib/db';
import { getBnbPrice, bnbToUsd } from '@/lib/bnb-price';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [rawGrowth, rawStats, bnbPrice] = await Promise.all([getGrowthData(), getSystemStats(), getBnbPrice()]);

  const growth = {
    ...rawGrowth,
    earningsByType: rawGrowth.earningsByType.map((e: any) => ({ ...e, total: bnbToUsd(Number(e.total), bnbPrice) })),
    txByType: rawGrowth.txByType.map((t: any) => ({ ...t, total: bnbToUsd(Number(t.total), bnbPrice) })),
  };
  const stats = {
    ...rawStats,
    totalVolume: bnbToUsd(rawStats.totalVolume, bnbPrice),
    totalEarnings: bnbToUsd(rawStats.totalEarnings, bnbPrice),
    pendingVolume: bnbToUsd(rawStats.pendingVolume, bnbPrice),
  };

  return NextResponse.json({ growth, stats });
}
