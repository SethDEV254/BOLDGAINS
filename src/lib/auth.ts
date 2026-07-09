import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET env var is not set');
const SECRET = new TextEncoder().encode(jwtSecret);
const COOKIE_NAME = 'bg_session';

export interface SessionPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function generateReferralCode(name: string): string {
  const base = name.replace(/\s+/g, '').toUpperCase().slice(0, 4);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${random}`;
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
