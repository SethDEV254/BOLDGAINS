import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, createTransaction, updateWalletBalance } from '@/lib/db';
import { REORDER_PACKAGES, REORDER_LEVEL_DISTRIBUTION, REORDER_BONUS_RATES } from '@/lib/packages';
import { distributePayouts, PayoutItem } from '@/lib/payout';
import { sendToPool } from '@/lib/pool-payout';

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

  // Send pool cuts sequentially — parallel txs from same wallet cause nonce conflicts
  const reorderRef = `reorder-${session.userId}-${Date.now()}`;
  (async () => {
    try {
      await sendToPool('products',    pkg.price * REORDER_BONUS_RATES.products,        `${reorderRef}-products`);
      await sendToPool('leadership',  pkg.price * REORDER_BONUS_RATES.leadership_pool,  `${reorderRef}-leadership`);
      await sendToPool('rank',        pkg.price * REORDER_BONUS_RATES.rank_pool,        `${reorderRef}-rank`);
    } catch (err) {
      console.error('[reorder] pool payout failed:', err);
    }
  })();

  return NextResponse.json({ success: true, qty: pkg.qty, price: pkg.price, levelsRewarded: payouts.length });
}
