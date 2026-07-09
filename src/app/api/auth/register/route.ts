import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  getUserByEmail, getUserByBscAddress, createUser,
  createTransaction, getTransactionByReference, getUserById,
} from '@/lib/db';
import { generateReferralCode } from '@/lib/auth';
import { REGISTRATION_FEE, BONUS_RATES, NETWORK_LEVEL_DISTRIBUTION } from '@/lib/packages';
import { distributePayouts, PayoutItem } from '@/lib/payout';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, refWallet, bscAddress, txHash } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });

    if (await getUserByEmail(email))
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    let sponsor: any = null;
    if (refWallet && /^0x[0-9a-fA-F]{40}$/.test(refWallet)) {
      sponsor = await getUserByBscAddress(refWallet);
    }

    let verifiedGross = REGISTRATION_FEE;
    let verifiedFee   = REGISTRATION_FEE * BONUS_RATES.management_fee_deposit;
    let verifiedNet   = verifiedGross - verifiedFee;

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
            if (p?.name === 'RegistrationFeePaid') { log = p; break; }
          } catch {}
        }

        if (!log) return NextResponse.json({ error: 'RegistrationFeePaid event not found' }, { status: 400 });

        verifiedGross = parseFloat(formatUnits(log.args.gross, 18));
        verifiedFee   = parseFloat(formatUnits(log.args.fee,   18));
        verifiedNet   = parseFloat(formatUnits(log.args.net,   18));
      } catch (err) {
        console.error('[register verify]', err);
        return NextResponse.json({ error: 'Failed to verify transaction on BSC' }, { status: 500 });
      }
    }

    const passwordHash    = await bcrypt.hash(password, 10);
    const newReferralCode = generateReferralCode(name);

    const userId = await createUser({
      name, email, passwordHash,
      referralCode: newReferralCode,
      sponsorId: sponsor?.id,
      packageLevel: 0,
      bscAddress: bscAddress || undefined,
    });

    await createTransaction({
      userId, type: 'registration',
      amount: verifiedGross, fee: verifiedFee, netAmount: verifiedNet,
      description: 'Registration fee',
      reference: txHash || undefined,
    });

    if (sponsor) {
      const payouts: PayoutItem[] = [];
      let currentSponsor = sponsor;
      let level = 1;

      while (currentSponsor && level <= NETWORK_LEVEL_DISTRIBUTION.length) {
        const rate = NETWORK_LEVEL_DISTRIBUTION[level - 1] || 0;
        if (rate > 0) {
          payouts.push({
            userId: currentSponsor.id,
            amount: verifiedGross * rate,
            type: 'network_level',
            description: `Level ${level} network bonus — ${name} registered`,
            sourceUserId: userId,
          });
        }
        if (!currentSponsor.sponsor_id) break;
        const upline = await getUserById(currentSponsor.sponsor_id);
        if (!upline) break;
        currentSponsor = upline;
        level++;
      }

      await distributePayouts(payouts);
    }

    return NextResponse.json({ success: true, pending: true });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
