import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByBscAddress, getUserByName, createWalletUser, getUserById } from '@/lib/db';
import { createSession, generateReferralCode } from '@/lib/auth';
import { isAdminAddress } from '@/lib/admin';
import { NONCE_COOKIE, verifyWalletSignature } from '@/lib/wallet-auth';
import { rateLimit } from '@/lib/rate-limit';

async function provisionAdmin(address: string) {
  let name = `Admin ${address.slice(0, 6)}`;
  if (await getUserByName(name)) name += Math.random().toString(36).slice(2, 6).toUpperCase();
  const referralCode = generateReferralCode(name);

  try {
    const userId = await createWalletUser({
      name, bscAddress: address, referralCode,
      role: 'admin', packageLevel: 0, status: 'active',
    });
    return await getUserById(userId);
  } catch {
    // concurrent provisioning race — someone else's request created it first
    return await getUserByBscAddress(address);
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, 'auth-verify', 15, 60);
    if (limited) return limited;

    const { address, signature } = await req.json();
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address) || !signature)
      return NextResponse.json({ error: 'Address and signature required' }, { status: 400 });

    const cookieStore = await cookies();
    const nonceCookie = cookieStore.get(NONCE_COOKIE)?.value;
    const origin = req.nextUrl.origin;

    const result = await verifyWalletSignature(nonceCookie, address, signature, origin);
    cookieStore.set(NONCE_COOKIE, '', { path: '/api/auth', maxAge: 0 });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });

    let user = await getUserByBscAddress(address);

    if (!user) {
      if (!isAdminAddress(address))
        return NextResponse.json(
          { error: 'No account found for this wallet. Please register.' }, { status: 404 },
        );
      user = await provisionAdmin(address);
      if (!user) return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const status = user.status ?? 'active';
    if (status === 'pending')
      return NextResponse.json({ error: 'Account pending admin approval. Contact your admin to activate your account.' }, { status: 403 });
    if (status === 'suspended')
      return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 });

    const role = isAdminAddress(address) ? 'admin' : 'member';
    const token = await createSession({ userId: user.id, address, role, name: user.name });

    cookieStore.set('bg_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });

    return NextResponse.json({ success: true, role });
  } catch (err) {
    console.error('[verify]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
