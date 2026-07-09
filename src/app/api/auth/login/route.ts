import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const status = user.status ?? 'active'; // treat legacy rows without status column as active
    if (status === 'pending') return NextResponse.json({ error: 'Account pending admin approval. Contact your admin to activate your account.' }, { status: 403 });
    if (status === 'suspended') return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 });

    const token = await createSession({
      userId: user.id, email: user.email, role: user.role, name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set('bg_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
