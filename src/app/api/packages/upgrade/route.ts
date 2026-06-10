import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, updateUserPackage, addEarning, createTransaction } from '@/lib/db';
import { PACKAGES, BONUS_RATES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packageLevel } = await req.json();
  const user = getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (packageLevel <= user.package_level)
    return NextResponse.json({ error: 'Can only upgrade to higher packages' }, { status: 400 });

  const newPkg = PACKAGES.find(p => p.level === packageLevel);
  if (!newPkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

  const fee = newPkg.price * BONUS_RATES.management_fee_deposit;
  createTransaction({
    userId: session.userId, type: 'upgrade', amount: newPkg.price, fee,
    netAmount: newPkg.price - fee, description: `Upgrade to ${newPkg.name} package`,
  });

  updateUserPackage(session.userId, packageLevel);

  if (user.sponsor_id) {
    const upgradeBonus = newPkg.price * BONUS_RATES.upgrade_bonus;
    addEarning(user.sponsor_id, 'upgrade_bonus', upgradeBonus, session.userId,
      `Upgrade bonus: ${user.name} upgraded to ${newPkg.name}`);
  }

  return NextResponse.json({ success: true, package: newPkg });
}
