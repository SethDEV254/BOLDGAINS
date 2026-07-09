import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDirectDownlines, getUserById, getNetworkStats } from '@/lib/db';
import { getPackageByLevel } from '@/lib/packages';

async function buildTree(userId: number, depth = 0): Promise<any[]> {
  if (depth > 3) return [];
  const children = await getDirectDownlines(userId);
  return Promise.all(children.map(async child => ({
    ...child,
    package: getPackageByLevel(child.package_level),
    children: await buildTree(child.id, depth + 1),
  })));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, stats] = await Promise.all([
    getUserById(session.userId),
    getNetworkStats(session.userId),
  ]);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tree = await buildTree(session.userId);

  return NextResponse.json({ stats, tree, bscAddress: user.bsc_address });
}
