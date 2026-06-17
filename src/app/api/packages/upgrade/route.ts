import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, updateUserPackage, createTransaction, getTransactionByReference } from '@/lib/db';
import { PACKAGES, BONUS_RATES } from '@/lib/packages';
import { distributePayouts } from '@/lib/payout';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packageLevel, txHash } = await req.json();
  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (packageLevel <= user.package_level)
    return NextResponse.json({ error: 'Can only upgrade to higher packages' }, { status: 400 });

  const newPkg = PACKAGES.find(p => p.level === packageLevel);
  if (!newPkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

  let gross = newPkg.price;
  let fee   = gross * BONUS_RATES.management_fee_deposit;
  let net   = gross - fee;

  if (txHash) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash))
      return NextResponse.json({ error: 'Invalid tx hash' }, { status: 400 });
    if (await getTransactionByReference(txHash))
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 });

    try {
      const { JsonRpcProvider, Interface, formatUnits } = await import('ethers');
      const { BSC_RPC, CONTRACT_ADDRESS, CONTRACT_ABI } = await import('@/lib/contract');

      const provider = new JsonRpcProvider(BSC_RPC);
      const receipt  = await provider.getTransactionReceipt(txHash);

      if (!receipt || receipt.status === 0)
        return NextResponse.json({ error: 'Transaction not found or reverted' }, { status: 400 });
      if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase())
        return NextResponse.json({ error: 'Wrong contract address' }, { status: 400 });

      const iface = new Interface(CONTRACT_ABI);
      let log: any = null;
      for (const l of receipt.logs) {
        try {
          const p = iface.parseLog({ topics: [...l.topics], data: l.data });
          if (p?.name === 'UpgradeFeePaid') { log = p; break; }
        } catch {}
      }

      if (!log) return NextResponse.json({ error: 'UpgradeFeePaid event not found' }, { status: 400 });
      if (Number(log.args.packageLevel) !== packageLevel)
        return NextResponse.json({ error: 'Package level mismatch in transaction' }, { status: 400 });

      gross = parseFloat(formatUnits(log.args.gross, 18));
      fee   = parseFloat(formatUnits(log.args.fee,   18));
      net   = parseFloat(formatUnits(log.args.net,   18));
    } catch (err) {
      console.error('[upgrade verify]', err);
      return NextResponse.json({ error: 'Failed to verify transaction on BSC' }, { status: 500 });
    }
  }

  await createTransaction({
    userId: session.userId, type: 'upgrade',
    amount: gross, fee, netAmount: net,
    description: `Upgrade to ${newPkg.name}`,
    reference: txHash || undefined,
  });

  await updateUserPackage(session.userId, packageLevel);

  if (user.sponsor_id) {
    await distributePayouts([{
      userId: user.sponsor_id,
      amount: gross * BONUS_RATES.upgrade_bonus,
      type: 'upgrade_bonus',
      description: `Upgrade bonus — ${user.name} → ${newPkg.name}`,
      sourceUserId: session.userId,
    }]);
  }

  return NextResponse.json({ success: true, package: newPkg });
}
