import { NextRequest, NextResponse, after } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, createTransaction, deductWalletBalance } from '@/lib/db';
import { REORDER_PACKAGES, REORDER_LEVEL_DISTRIBUTION, REORDER_BONUS_RATES } from '@/lib/packages';
import { distributePayouts, PayoutItem } from '@/lib/payout';
import { sendToPool } from '@/lib/pool-payout';
import { getBnbPrice } from '@/lib/bnb-price';

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

  // pkg.price is in USD — convert to BNB for all on-chain and wallet_balance operations
  const bnbPrice = await getBnbPrice();
  const pkgBnb = pkg.price / bnbPrice;

  const deducted = await deductWalletBalance(session.userId, pkgBnb);
  if (!deducted) return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });

  await createTransaction({
    userId: session.userId,
    type: 'product_reorder',
    amount: pkgBnb,
    fee: 0,
    netAmount: pkgBnb,
    description: `BoldGlow™ Reorder — ${pkg.qty} unit${pkg.qty > 1 ? 's' : ''}`,
  });

  // Walk up to 10 upline levels and pay each their share of the 15%
  const payouts: PayoutItem[] = [];
  let currentId: number | null = user.sponsor_id ?? null;

  for (let level = 0; level < REORDER_LEVEL_DISTRIBUTION.length; level++) {
    if (!currentId) break;
    const upline = await getUserById(currentId);
    if (!upline) break;

    const rate = REORDER_LEVEL_DISTRIBUTION[level];
    payouts.push({
      userId: upline.id,
      amount: pkgBnb * rate,
      type: 'network_level',
      description: `Network Level ${level + 1} — ${user.name} (${pkg.qty} units)`,
      sourceUserId: session.userId,
    });

    currentId = upline.sponsor_id ?? null;
  }

  // Runs after the response is sent (after() keeps the invocation alive until it
  // settles) — sequential since network payouts and pool cuts share the operator
  // wallet; parallel calls would cause nonce conflicts.
  const reorderRef = `reorder-${session.userId}-${Date.now()}`;
  const paidLevels = payouts.length;
  after(async () => {
    if (payouts.length > 0) await distributePayouts(payouts);
    await sendToPool('products',   pkgBnb * REORDER_BONUS_RATES.products,       `${reorderRef}-products`);
    await sendToPool('leadership', pkgBnb * REORDER_BONUS_RATES.leadership_pool, `${reorderRef}-leadership`);
    await sendToPool('rank',       pkgBnb * REORDER_BONUS_RATES.rank_pool,       `${reorderRef}-rank`);
  });

  return NextResponse.json({ success: true, qty: pkg.qty, price: pkg.price, levelsRewarded: paidLevels });
}
