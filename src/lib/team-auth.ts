import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(s);
}

export const TEAM_COOKIE_NAME = 'bg_team_session';

export interface TeamSessionPayload {
  role: 'team_viewer';
}

export async function createTeamSession(): Promise<string> {
  return new SignJWT({ role: 'team_viewer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyTeamSession(token: string): Promise<TeamSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== 'team_viewer') return null;
    return payload as unknown as TeamSessionPayload;
  } catch {
    return null;
  }
}

export async function getTeamSession(): Promise<TeamSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEAM_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyTeamSession(token);
}
