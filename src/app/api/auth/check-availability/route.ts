import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserByName } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (email && await getUserByEmail(email))
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  if (name && await getUserByName(name))
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

  return NextResponse.json({ ok: true });
}
