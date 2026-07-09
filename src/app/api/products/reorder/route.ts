import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, createTransaction, updateWalletBalance } from '@/lib/db';
import { REORDER_PACKAGES, REORDER_LEVEL_DISTRIBUTION } from '@/lib/packages';
import { distributePayouts, PayoutItem } from '@/lib/payout';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packageId } = await req.json();

  const pkg = REORDER_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return NextResponse.json({ error: 'Invalid reorder package' }, { status: 400 });

  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (user.package_level === 0)
    return NextResponse.json({ error: 'You need an active membership package to reorder' }, { status: 403 });

  if (user.wallet_balance < pkg.price)
    return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });

  await updateWalletBalance(session.userId, -pkg.price);

  await createTransaction({
    userId: session.userId,
    type: 'product_reorder',
    amount: pkg.price,
    fee: 0,
    netAmount: pkg.price,
    description: `BoldGlow™ Reorder — ${pkg.qty} unit${pkg.qty > 1 ? 's' : ''}`,
  });

  // Walk up to 10 upline levels and pay each their share of the 30%
  const payouts: PayoutItem[] = [];
  let currentId: number | null = user.sponsor_id ?? null;

  for (let level = 0; level < REORDER_LEVEL_DISTRIBUTION.length; level++) {
    if (!currentId) break;
    const upline = await getUserById(currentId);
    if (!upline) break;

    const rate = REORDER_LEVEL_DISTRIBUTION[level];
    payouts.push({
      userId: upline.id,
      amount: pkg.price * rate,
      type: 'product_reorder',
      description: `Product Reorder Bonus L${level + 1} — ${user.name} (${pkg.qty} units)`,
      sourceUserId: session.userId,
    });

    currentId = upline.sponsor_id ?? null;
  }

  if (payouts.length > 0) await distributePayouts(payouts);

  return NextResponse.json({ success: true, qty: pkg.qty, price: pkg.price, levelsRewarded: payouts.length });
}
