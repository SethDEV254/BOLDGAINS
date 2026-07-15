import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserByName, getUserByBscAddress, createWalletUser } from '@/lib/db';
import { generateReferralCode } from '@/lib/auth';
import { PACKAGES } from '@/lib/packages';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, bscAddress, sponsorWallet, packageLevel } = await req.json();

  if (!name || !bscAddress)
    return NextResponse.json({ error: 'Name and wallet address are required' }, { status: 400 });
  if (!/^0x[0-9a-fA-F]{40}$/.test(bscAddress))
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });

  if (await getUserByBscAddress(bscAddress))
    return NextResponse.json({ error: 'Wallet already registered' }, { status: 409 });
  if (await getUserByName(name))
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

  PACKAGES.find(p => p.level === (packageLevel || 0));
  let sponsorId: number | undefined;

  if (sponsorWallet) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(sponsorWallet))
      return NextResponse.json({ error: 'Invalid sponsor wallet address' }, { status: 400 });
    const sponsor = await getUserByBscAddress(sponsorWallet);
    if (!sponsor) return NextResponse.json({ error: 'No member found with that sponsor wallet' }, { status: 400 });
    sponsorId = sponsor.id;
  }

  const referralCode = generateReferralCode(name);

  const userId = await createWalletUser({
    name, bscAddress,
    referralCode,
    sponsorId,
    packageLevel: packageLevel || 0,
    status: 'active',
  });

  return NextResponse.json({ success: true, userId });
}
