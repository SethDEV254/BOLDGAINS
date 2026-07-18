import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import {
  getUserByName, getUserByBscAddress, createWalletUser,
  createTransaction, getTransactionByReference,
} from '@/lib/db';
import { createSession, generateReferralCode } from '@/lib/auth';
import { isAdminAddress } from '@/lib/admin';
import { REGISTRATION_REFERRAL_RATE } from '@/lib/packages';
import { distributePayouts, type PayoutItem } from '@/lib/payout';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, 'auth-register', 10, 60);
    if (limited) return limited;

    const { name, bscAddress, refWallet, txHash } = await req.json();

    if (!name || !bscAddress || !txHash)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    if (!/^0x[0-9a-fA-F]{40}$/.test(bscAddress))
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash))
      return NextResponse.json({ error: 'Invalid tx hash' }, { status: 400 });

    if (await getUserByBscAddress(bscAddress))
      return NextResponse.json({ error: 'Wallet already registered — sign in instead' }, { status: 409 });

    if (await getUserByName(name))
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    if (await getTransactionByReference(txHash))
      return NextResponse.json({ error: 'Transaction already used' }, { status: 409 });

    let sponsor: any = null;
    if (refWallet && /^0x[0-9a-fA-F]{40}$/.test(refWallet)) {
      sponsor = await getUserByBscAddress(refWallet);
    }

    let verifiedGross = 0, verifiedFee = 0, verifiedNet = 0;

    try {
      const { JsonRpcProvider, Interface, formatUnits } = await import('ethers');
      const { BSC_RPC, CONTRACT_ADDRESS, CONTRACT_ABI } = await import('@/lib/contract');

      const provider = new JsonRpcProvider(BSC_RPC);
      const receipt  = await provider.getTransactionReceipt(txHash);

      if (!receipt || receipt.status === 0)
        return NextResponse.json({ error: 'Transaction not found or reverted' }, { status: 400 });
      if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase())
        return NextResponse.json({ error: 'Wrong contract address' }, { status: 400 });
      if (receipt.from.toLowerCase() !== bscAddress.toLowerCase())
        return NextResponse.json({ error: 'Transaction sender does not match wallet address' }, { status: 400 });

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

    const newReferralCode = generateReferralCode(name);
    const role = isAdminAddress(bscAddress) ? 'admin' : 'member';

    const userId = await createWalletUser({
      name, bscAddress,
      referralCode: newReferralCode,
      sponsorId: sponsor?.id,
      packageLevel: 0,
      role,
      status: 'active',
    });

    await createTransaction({
      userId, type: 'registration',
      amount: verifiedGross, fee: verifiedFee, netAmount: verifiedNet,
      description: 'Registration fee',
      reference: txHash,
    });

    // 50% of the registration fee to the direct referrer, paid on-chain via the operator
    // wallet (same mechanism as every other bonus payout); the rest stays in the contract.
    if (sponsor) {
      const items: PayoutItem[] = [{
        userId: sponsor.id,
        amount: verifiedGross * REGISTRATION_REFERRAL_RATE,
        type: 'referral_direct',
        description: `Registration referral (50%) — ${name} registered`,
        sourceUserId: userId,
      }];

      after(() => distributePayouts(items));
    }

    const token = await createSession({
      userId, address: bscAddress, role, name,
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
