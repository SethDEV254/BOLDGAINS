import { NextResponse } from 'next/server';
import { getTeamSession } from '@/lib/team-auth';

export async function GET() {
  const session = await getTeamSession();
  if (!session) return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true });
}
