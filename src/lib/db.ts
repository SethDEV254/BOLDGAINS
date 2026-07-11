import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

function _sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL env var not set');
  return neon(url);
}

let initialized = false;

async function ensureInit() {
  if (initialized) return;
  initialized = true; // block concurrent inits; reset below on failure
  try {
    const sql = _sql();

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        referral_code TEXT UNIQUE NOT NULL,
        sponsor_id INTEGER,
        package_level INTEGER DEFAULT 0,
        wallet_balance DOUBLE PRECISION DEFAULT 0,
        total_earned DOUBLE PRECISION DEFAULT 0,
        bsc_address TEXT,
        role TEXT DEFAULT 'member',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        fee DOUBLE PRECISION DEFAULT 0,
        net_amount DOUBLE PRECISION NOT NULL,
        description TEXT,
        reference TEXT,
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS earnings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        source_user_id INTEGER,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_sponsor ON users(sponsor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_earnings_user ON earnings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(reference)`;

    // Migrations — safe to run on every cold start
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bsc_address TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'`;
    await sql`UPDATE users SET status = 'active' WHERE status IS NULL`;

    const admins = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (admins.length === 0) {
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
      if (!adminPassword) throw new Error('ADMIN_DEFAULT_PASSWORD env var is not set');
      const hash = await bcrypt.hash(adminPassword, 10);
      await sql`
        INSERT INTO users (name, email, password_hash, referral_code, role, package_level, wallet_balance)
        VALUES ('Admin', 'admin@boldgains.com', ${hash}, 'ADMIN001', 'admin', 12, 0)
        ON CONFLICT DO NOTHING
      `;
    }
  } catch (err) {
    initialized = false; // allow retry on next request
    throw err;
  }
}

async function getDb() {
  await ensureInit();
  return _sql();
}

export async function getUserByEmail(email: string) {
  const sql = await getDb();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return rows[0] || null;
}

export async function getUserById(id: number) {
  const sql = await getDb();
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] || null;
}

export async function getUserByReferralCode(code: string) {
  const sql = await getDb();
  const rows = await sql`SELECT * FROM users WHERE referral_code = ${code}`;
  return rows[0] || null;
}

export async function getUserByBscAddress(address: string) {
  const sql = await getDb();
  const rows = await sql`SELECT * FROM users WHERE LOWER(bsc_address) = LOWER(${address})`;
  return rows[0] || null;
}

export async function createUser(data: {
  name: string; email: string; passwordHash: string;
  referralCode: string; sponsorId?: number; packageLevel: number; bscAddress?: string;
  status?: string;
}) {
  const sql = await getDb();
  const status = data.status ?? 'pending';
  const rows = await sql`
    INSERT INTO users (name, email, password_hash, referral_code, sponsor_id, package_level, bsc_address, status)
    VALUES (${data.name}, ${data.email}, ${data.passwordHash}, ${data.referralCode},
            ${data.sponsorId ?? null}, ${data.packageLevel}, ${data.bscAddress ?? null}, ${status})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateUserBscAddress(userId: number, bscAddress: string) {
  const sql = await getDb();
  await sql`UPDATE users SET bsc_address = ${bscAddress} WHERE id = ${userId}`;
}

export async function updateUserPackage(userId: number, packageLevel: number) {
  const sql = await getDb();
  await sql`UPDATE users SET package_level = ${packageLevel} WHERE id = ${userId}`;
}

export async function updateWalletBalance(userId: number, amount: number) {
  const sql = await getDb();
  await sql`UPDATE users SET wallet_balance = wallet_balance + ${amount} WHERE id = ${userId}`;
}

export async function addEarning(userId: number, type: string, amount: number, sourceUserId?: number, description?: string) {
  const sql = await getDb();
  await sql`
    INSERT INTO earnings (user_id, type, amount, source_user_id, description)
    VALUES (${userId}, ${type}, ${amount}, ${sourceUserId ?? null}, ${description ?? null})
  `;
  await sql`
    UPDATE users SET wallet_balance = wallet_balance + ${amount}, total_earned = total_earned + ${amount}
    WHERE id = ${userId}
  `;
}

export async function recordEarning(userId: number, type: string, amount: number, sourceUserId?: number, description?: string) {
  const sql = await getDb();
  await sql`
    INSERT INTO earnings (user_id, type, amount, source_user_id, description)
    VALUES (${userId}, ${type}, ${amount}, ${sourceUserId ?? null}, ${description ?? null})
  `;
  await sql`UPDATE users SET total_earned = total_earned + ${amount} WHERE id = ${userId}`;
}

export async function createTransaction(data: {
  userId: number; type: string; amount: number; fee: number;
  netAmount: number; description?: string; reference?: string; status?: string;
}) {
  const sql = await getDb();
  const rows = await sql`
    INSERT INTO transactions (user_id, type, amount, fee, net_amount, description, reference, status)
    VALUES (${data.userId}, ${data.type}, ${data.amount}, ${data.fee}, ${data.netAmount},
            ${data.description ?? null}, ${data.reference ?? null}, ${data.status ?? 'completed'})
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function getTransactionByReference(reference: string) {
  const sql = await getDb();
  const rows = await sql`SELECT id FROM transactions WHERE reference = ${reference}`;
  return rows[0] || null;
}

export async function getUserTransactions(userId: number, limit = 20) {
  const sql = await getDb();
  return await sql`
    SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}
  `;
}

export async function getUserEarnings(userId: number) {
  const sql = await getDb();
  return await sql`
    SELECT e.*, u.name as source_name FROM earnings e
    LEFT JOIN users u ON e.source_user_id = u.id
    WHERE e.user_id = ${userId} ORDER BY e.created_at DESC LIMIT 50
  `;
}

export async function getUserEarningsSummary(userId: number) {
  const sql = await getDb();
  return await sql`
    SELECT type, SUM(amount) as total FROM earnings WHERE user_id = ${userId} GROUP BY type
  `;
}

export async function getLatestActivityId(userId: number | null) {
  const sql = await getDb();
  const [earningsRow] = userId
    ? await sql`SELECT MAX(id) as max FROM earnings WHERE user_id = ${userId}`
    : await sql`SELECT MAX(id) as max FROM earnings`;
  const [txRow] = userId
    ? await sql`SELECT MAX(id) as max FROM transactions WHERE user_id = ${userId}`
    : await sql`SELECT MAX(id) as max FROM transactions`;
  return { earningsMaxId: Number(earningsRow?.max) || 0, txMaxId: Number(txRow?.max) || 0 };
}

export async function getDirectDownlines(userId: number) {
  const sql = await getDb();
  return await sql`
    SELECT id, name, email, referral_code, package_level, total_earned, created_at
    FROM users WHERE sponsor_id = ${userId}
  `;
}

export async function getNetworkStats(userId: number) {
  const sql = await getDb();
  const [direct] = await sql`SELECT COUNT(*) as count FROM users WHERE sponsor_id = ${userId}`;
  const total = await getNetworkCount(userId);
  return { directCount: Number(direct.count), totalNetwork: total };
}

async function getNetworkCount(userId: number, depth = 0): Promise<number> {
  if (depth > 10) return 0;
  const sql = await getDb();
  const children = await sql`SELECT id FROM users WHERE sponsor_id = ${userId}`;
  let count = children.length;
  for (const child of children) count += await getNetworkCount(child.id, depth + 1);
  return count;
}

export async function getAllUsers() {
  const sql = await getDb();
  return await sql`
    SELECT u.*, s.name as sponsor_name FROM users u
    LEFT JOIN users s ON u.sponsor_id = s.id
    ORDER BY u.created_at DESC
  `;
}

export async function getSystemStats() {
  const sql = await getDb();
  const [
    usersRow, volumeRow, earningsRow, packagesRow,
    suspendedRow, pendingCountRow, pendingVolRow,
  ] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM users WHERE role != 'admin'`,
    sql`SELECT COALESCE(SUM(amount), 0) as s FROM transactions
        WHERE type IN ('registration', 'upgrade', 'product_reorder', 'deposit')`,
    sql`SELECT COALESCE(SUM(amount), 0) as s FROM earnings`,
    sql`SELECT COUNT(*) as c FROM users WHERE package_level > 0`,
    sql`SELECT COUNT(*) as c FROM users WHERE status = 'suspended'`,
    sql`SELECT COUNT(*) as c FROM transactions WHERE type = 'withdrawal' AND status = 'pending'`,
    sql`SELECT COALESCE(SUM(amount), 0) as s FROM transactions WHERE type = 'withdrawal' AND status = 'pending'`,
  ]);
  return {
    totalUsers: Number(usersRow[0].c),
    totalVolume: Number(volumeRow[0].s),
    totalEarnings: Number(earningsRow[0].s),
    activePackages: Number(packagesRow[0].c),
    suspended: Number(suspendedRow[0].c),
    pendingWithdrawals: Number(pendingCountRow[0].c),
    pendingVolume: Number(pendingVolRow[0].s),
  };
}

export async function setUserStatus(userId: number, status: 'active' | 'suspended') {
  const sql = await getDb();
  await sql`UPDATE users SET status = ${status} WHERE id = ${userId}`;
}

export async function adminSetPackage(userId: number, packageLevel: number) {
  const sql = await getDb();
  await sql`UPDATE users SET package_level = ${packageLevel} WHERE id = ${userId}`;
}

export async function adminAdjustBalance(userId: number, amount: number, _adminId: number, reason: string) {
  const sql = await getDb();
  await sql`UPDATE users SET wallet_balance = wallet_balance + ${amount} WHERE id = ${userId}`;
  await sql`
    INSERT INTO transactions (user_id, type, amount, fee, net_amount, description, status)
    VALUES (${userId}, 'admin_adjustment', ${Math.abs(amount)}, 0, ${amount}, ${'Admin: ' + reason}, 'completed')
  `;
}

export async function deleteUser(userId: number) {
  const sql = await getDb();
  await sql`DELETE FROM earnings WHERE user_id = ${userId}`;
  await sql`DELETE FROM transactions WHERE user_id = ${userId}`;
  await sql`UPDATE users SET sponsor_id = NULL WHERE sponsor_id = ${userId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
}

export async function getAllTransactions(limit = 100) {
  const sql = await getDb();
  return await sql`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC LIMIT ${limit}
  `;
}

export async function approveWithdrawal(txId: number) {
  const sql = await getDb();
  await sql`UPDATE transactions SET status = 'completed' WHERE id = ${txId}`;
}

export async function completeTransaction(txId: number, txHash: string) {
  const sql = await getDb();
  await sql`UPDATE transactions SET status = 'completed', reference = ${txHash} WHERE id = ${txId}`;
}

export async function failTransaction(txId: number) {
  const sql = await getDb();
  await sql`UPDATE transactions SET status = 'failed' WHERE id = ${txId}`;
}

export async function rejectWithdrawal(txId: number) {
  const sql = await getDb();
  const rows = await sql`SELECT * FROM transactions WHERE id = ${txId}`;
  if (!rows[0]) return;
  const tx = rows[0];
  await sql`UPDATE transactions SET status = 'rejected' WHERE id = ${txId}`;
  await sql`UPDATE users SET wallet_balance = wallet_balance + ${tx.amount} WHERE id = ${tx.user_id}`;
}

export async function getGrowthData() {
  const sql = await getDb();
  const [byDay, earningsByType, txByType] = await Promise.all([
    sql`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM users WHERE role != 'admin'
      GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30
    `,
    sql`SELECT type, SUM(amount) as total FROM earnings GROUP BY type`,
    sql`SELECT type, COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM transactions GROUP BY type`,
  ]);
  return { byDay: [...byDay].reverse(), earningsByType, txByType };
}
