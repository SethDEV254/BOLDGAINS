import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserByReferralCode, createUser, addEarning, updateWalletBalance, createTransaction } from '@/lib/db';
import { createSession, generateReferralCode } from '@/lib/auth';
import { PACKAGES, BONUS_RATES, NETWORK_LEVEL_DISTRIBUTION } from '@/lib/packages';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, referralCode, packageLevel } = await req.json();

    if (!name || !email || !password || !packageLevel)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });

    if (getUserByEmail(email))
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const pkg = PACKAGES.find(p => p.level === packageLevel);
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    let sponsor: any = null;
    if (referralCode) {
      sponsor = getUserByReferralCode(referralCode);
      if (!sponsor) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newReferralCode = generateReferralCode(name);

    const userId = createUser({
      name, email, passwordHash,
      referralCode: newReferralCode,
      sponsorId: sponsor?.id,
      packageLevel,
    });

    const fee = pkg.price * BONUS_RATES.management_fee_deposit;
    createTransaction({
      userId, type: 'registration', amount: pkg.price, fee, netAmount: pkg.price - fee,
      description: `${pkg.name} package registration`,
    });

    if (sponsor) {
      const directBonus = pkg.price * BONUS_RATES.direct_bonus;
      addEarning(sponsor.id, 'direct_bonus', directBonus, userId,
        `Direct bonus from ${name} - ${pkg.name} package`);

      let currentSponsor = sponsor;
      let level = 2;
      while (currentSponsor.sponsor_id && level <= NETWORK_LEVEL_DISTRIBUTION.length + 1) {
        const { getUserById } = await import('@/lib/db');
        const upline = getUserById(currentSponsor.sponsor_id);
        if (!upline) break;
        const rate = NETWORK_LEVEL_DISTRIBUTION[level - 2] || 0;
        if (rate > 0) {
          addEarning(upline.id, 'network_level', pkg.price * rate, userId,
            `Level ${level} network bonus from ${name}`);
        }
        currentSponsor = upline;
        level++;
      }
    }

    const token = await createSession({ userId, email, role: 'member', name });
    const cookieStore = await cookies();
    cookieStore.set('bg_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
