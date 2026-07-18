import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { NONCE_COOKIE, NONCE_TTL_MS, buildSignInMessage } from '@/lib/wallet-auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'auth-nonce', 20, 60);
  if (limited) return limited;

  const { address } = await req.json();
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address))
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });

  const nonce = randomUUID();
  const issuedAt = Date.now();
  const origin = req.nextUrl.origin;

  const cookieStore = await cookies();
  cookieStore.set(NONCE_COOKIE, `${nonce}:${address.toLowerCase()}:${issuedAt}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: NONCE_TTL_MS / 1000,
    path: '/api/auth',
  });

  const message = buildSignInMessage(address, nonce, issuedAt, origin);
  return NextResponse.json({ message });
}
