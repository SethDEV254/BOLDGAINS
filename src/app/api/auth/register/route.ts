import { NextRequest, NextResponse, after } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import {
  getUserByEmail, getUserByName, getUserByBscAddress, getUserById, createUser,
  createTransaction, getTransactionByReference,
} from '@/lib/db';
import { createSession, generateReferralCode } from '@/lib/auth';
import {
  REGISTRATION_FEE, REGISTRATION_FEE_GROSS, BONUS_RATES,
  REGISTRATION_REFERRAL_DIRECT_RATE, REGISTRATION_REFERRAL_INDIRECT_RATE,
} from '@/lib/packages';
import { distributePayouts, type PayoutItem } from '@/lib/payout';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, refWallet, bscAddress, txHash } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });

    if (await getUserByEmail(email))
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    if (await getUserByName(name))
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    let sponsor: any = null;
    if (refWallet && /^0x[0-9a-fA-F]{40}$/.test(refWallet)) {
      sponsor = await getUserByBscAddress(refWallet);
    }

    let verifiedGross = REGISTRATION_FEE_GROSS;
    let verifiedFee   = REGISTRATION_FEE_GROSS * BONUS_RATES.management_fee_deposit;
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
      status: 'active',
    });

    await createTransaction({
      userId, type: 'registration',
      amount: verifiedGross, fee: verifiedFee, netAmount: verifiedNet,
      description: 'Registration fee',
      reference: txHash || undefined,
    });

    // 30% of base fee → direct sponsor, 15% → indirect (level-2) sponsor, 5% stays in contract
    if (sponsor && txHash) {
      const baseFee = verifiedGross * (REGISTRATION_FEE / REGISTRATION_FEE_GROSS);
      const items: PayoutItem[] = [{
        userId: sponsor.id,
        amount: baseFee * REGISTRATION_REFERRAL_DIRECT_RATE,
        type: 'referral_direct',
        description: `Registration referral (direct) — ${name} registered`,
        sourceUserId: userId,
      }];

      if (sponsor.sponsor_id) {
        const indirectSponsor = await getUserById(sponsor.sponsor_id);
        if (indirectSponsor) {
          items.push({
            userId: indirectSponsor.id,
            amount: baseFee * REGISTRATION_REFERRAL_INDIRECT_RATE,
            type: 'referral_indirect',
            description: `Registration referral (indirect) — ${name} registered`,
            sourceUserId: userId,
          });
        }
      }

      after(() => distributePayouts(items));
    }

    const token = await createSession({
      userId, email, role: 'member', name,
    });
    const cookieStore = await cookies();
    cookieStore.set('bg_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });

    return NextResponse.json({ success: true, pending: false });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
