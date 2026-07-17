import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TEAM_COOKIE_NAME } from '@/lib/team-auth';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(TEAM_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
