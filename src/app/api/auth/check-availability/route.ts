import { NextRequest, NextResponse } from 'next/server';
import { getUserByName, getUserByBscAddress } from '@/lib/db';
import { isAdminAddress } from '@/lib/admin';

export async function POST(req: NextRequest) {
  const { name, bscAddress } = await req.json();

  if (name && await getUserByName(name))
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

  if (bscAddress && await getUserByBscAddress(bscAddress))
    return NextResponse.json({ error: 'Wallet already registered — sign in instead' }, { status: 409 });

  const isAdmin = !!bscAddress && isAdminAddress(bscAddress);
  return NextResponse.json({ ok: true, isAdmin });
}
