import { getSession, type SessionPayload } from './auth';
import { getUserById } from './db';

export function isAdminAddress(address: string): boolean {
  const list = process.env.ADMIN_WALLET_ADDRESSES || '';
  const allowlist = list.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  return allowlist.includes(address.toLowerCase());
}

// Re-checks admin status against the DB on every call instead of trusting the
// JWT claim alone, so revoking a user's role/status takes effect immediately
// rather than waiting out the session's 7-day expiry.
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') return null;

  const user = await getUserById(session.userId);
  if (!user || user.role !== 'admin' || user.status !== 'active') return null;

  return session;
}
