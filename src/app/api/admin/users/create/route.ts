import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { getUserByEmail, getUserByReferralCode, createUser } from '@/lib/db';
import { generateReferralCode } from '@/lib/auth';
import { PACKAGES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, email, password, referralCode, packageLevel } = await req.json();

  if (!name || !email || !password)
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });

  if (getUserByEmail(email))
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const pkg = PACKAGES.find(p => p.level === (packageLevel || 0));
  let sponsorId: number | undefined;

  if (referralCode) {
    const sponsor = getUserByReferralCode(referralCode);
    if (!sponsor) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    sponsorId = sponsor.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newReferralCode = generateReferralCode(name);

  const userId = createUser({
    name, email, passwordHash,
    referralCode: newReferralCode,
    sponsorId,
    packageLevel: packageLevel || 0,
  });

  return NextResponse.json({ success: true, userId, referralCode: newReferralCode });
}
