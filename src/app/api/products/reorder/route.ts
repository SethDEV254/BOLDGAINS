import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, createTransaction, updateWalletBalance } from '@/lib/db';
import { REORDER_PACKAGES, REORDER_BONUS_RATES } from '@/lib/packages';
import { distributePayouts } from '@/lib/payout';

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

  if (user.sponsor_id) {
    const sponsorBonus = pkg.price * REORDER_BONUS_RATES.products;
    await distributePayouts([{
      userId: user.sponsor_id,
      amount: sponsorBonus,
      type: 'product_reorder',
      description: `Product Reorder Bonus — ${user.name} (${pkg.qty} units)`,
      sourceUserId: session.userId,
    }]);
  }

  return NextResponse.json({ success: true, qty: pkg.qty, price: pkg.price });
}
