import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { getUserByEmail, getUserByBscAddress, createUser } from '@/lib/db';
import { generateReferralCode } from '@/lib/auth';
import { PACKAGES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, email, password, sponsorWallet, packageLevel, bscAddress } = await req.json();

  if (!name || !email || !password)
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });

  if (await getUserByEmail(email))
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  PACKAGES.find(p => p.level === (packageLevel || 0));
  let sponsorId: number | undefined;

  if (sponsorWallet) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(sponsorWallet))
      return NextResponse.json({ error: 'Invalid sponsor wallet address' }, { status: 400 });
    const sponsor = await getUserByBscAddress(sponsorWallet);
    if (!sponsor) return NextResponse.json({ error: 'No member found with that sponsor wallet' }, { status: 400 });
    sponsorId = sponsor.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const internalCode = generateReferralCode(name);

  const userId = await createUser({
    name, email, passwordHash,
    referralCode: internalCode,
    sponsorId,
    packageLevel: packageLevel || 0,
    bscAddress: bscAddress || undefined,
    status: 'active',
  });

  return NextResponse.json({ success: true, userId });
}
