import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './db';

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function rateLimit(
  req: NextRequest, routeKey: string, maxAttempts: number, windowSeconds: number,
): Promise<NextResponse | null> {
  const key = `${routeKey}:${getClientIp(req)}`;
  const allowed = await checkRateLimit(key, maxAttempts, windowSeconds);
  if (!allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  return null;
}
