import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDirectDownlines, getUserById, getNetworkStats, getEarningsBySource } from '@/lib/db';
import { getPackageByLevel } from '@/lib/packages';

async function buildTree(userId: number, earningsBySource: Record<number, number>, depth = 0): Promise<any[]> {
  if (depth > 3) return [];
  const children = await getDirectDownlines(userId);
  return Promise.all(children.map(async child => ({
    ...child,
    package: getPackageByLevel(child.package_level),
    earnedFromReferral: earningsBySource[child.id] || 0,
    children: await buildTree(child.id, earningsBySource, depth + 1),
  })));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, stats, earningsBySourceRows] = await Promise.all([
    getUserById(session.userId),
    getNetworkStats(session.userId),
    getEarningsBySource(session.userId),
  ]);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const earningsBySource: Record<number, number> = {};
  let totalFromNetwork = 0;
  for (const row of earningsBySourceRows) {
    const amount = Number(row.total);
    earningsBySource[row.source_user_id] = amount;
    totalFromNetwork += amount;
  }

  const tree = await buildTree(session.userId, earningsBySource);

  return NextResponse.json({ stats, tree, bscAddress: user.bsc_address, totalFromNetwork });
}
