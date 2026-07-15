import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import {
  getUserByName, getUserByBscAddress, createWalletUser,
  createTransaction, getTransactionByReference, recordEarning,
} from '@/lib/db';
import { createSession, generateReferralCode } from '@/lib/auth';
import { isAdminAddress } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const { name, bscAddress, txHash } = await req.json();

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

    let verifiedGross = 0, referrerAmount = 0, contractAmount = 0, onChainReferrer = '';

    try {
      const { JsonRpcProvider, Interface, formatUnits, ZeroAddress } = await import('ethers');
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

      verifiedGross   = parseFloat(formatUnits(log.args.gross, 18));
      referrerAmount  = parseFloat(formatUnits(log.args.referrerAmount, 18));
      contractAmount  = parseFloat(formatUnits(log.args.contractAmount, 18));
      onChainReferrer = log.args.referrer as string;
      if (onChainReferrer === ZeroAddress) onChainReferrer = '';
    } catch (err) {
      console.error('[register verify]', err);
      return NextResponse.json({ error: 'Failed to verify transaction on BSC' }, { status: 500 });
    }

    // The referrer credited on-chain is the source of truth — not the client-supplied refWallet.
    const sponsor = onChainReferrer ? await getUserByBscAddress(onChainReferrer) : null;

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
      amount: verifiedGross, fee: referrerAmount, netAmount: contractAmount,
      description: 'Registration fee',
      reference: txHash,
    });

    // Referral commission (50%) was already paid on-chain, atomically, in the same tx —
    // just record it for the sponsor's earnings history (no wallet_balance credit, funds
    // went straight to their own wallet, not the platform balance).
    if (sponsor && referrerAmount > 0) {
      after(() => recordEarning(
        sponsor.id, 'referral_direct', referrerAmount, userId,
        `Registration referral (on-chain, 50%) — ${name} registered`,
      ));
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
