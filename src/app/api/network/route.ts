import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDirectDownlines, getUserById, getNetworkStats } from '@/lib/db';
import { getPackageByLevel } from '@/lib/packages';

function buildTree(userId: number, depth = 0): any {
  if (depth > 3) return null;
  const children = getDirectDownlines(userId);
  return children.map(child => ({
    ...child,
    package: getPackageByLevel(child.package_level),
    children: buildTree(child.id, depth + 1),
  }));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stats = getNetworkStats(session.userId);
  const tree = buildTree(session.userId);

  return NextResponse.json({ stats, tree, referralCode: user.referral_code });
}
