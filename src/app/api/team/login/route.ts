import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import { createTeamSession, TEAM_COOKIE_NAME } from '@/lib/team-auth';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const expectedEmail = process.env.TEAM_VIEW_EMAIL || '';
    const expectedPassword = process.env.TEAM_VIEW_PASSWORD || '';

    if (!expectedEmail || !expectedPassword)
      return NextResponse.json({ error: 'Team view is not configured' }, { status: 500 });

    if (
      typeof email !== 'string' || typeof password !== 'string' ||
      !safeEqual(email.trim().toLowerCase(), expectedEmail.toLowerCase()) ||
      !safeEqual(password, expectedPassword)
    ) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createTeamSession();
    const cookieStore = await cookies();
    cookieStore.set(TEAM_COOKIE_NAME, token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[team/login]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
