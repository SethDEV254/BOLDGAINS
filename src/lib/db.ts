import { neon } from '@neondatabase/serverless';

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
        email TEXT,
        password_hash TEXT,
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

    await sql`
      CREATE TABLE IF NOT EXISTS rate_limit_attempts (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_sponsor ON users(sponsor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_earnings_user ON earnings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(reference)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time ON rate_limit_attempts(key, created_at)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email))`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_lower ON users (LOWER(name))`;

    // Migrations — safe to run on every cold start
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bsc_address TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'`;
    await sql`UPDATE users SET status = 'active' WHERE status IS NULL`;
    await sql`ALTER TABLE earnings ADD COLUMN IF NOT EXISTS on_chain BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`;
    await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;

    try {
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_bsc_address_lower
        ON users (LOWER(bsc_address)) WHERE bsc_address IS NOT NULL
      `;
    } catch (err) {
      console.error('[db] could not enforce unique bsc_address — check for duplicates', err);
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

export async function getUserByName(name: string) {
  const sql = await getDb();
  const rows = await sql`SELECT * FROM users WHERE LOWER(name) = LOWER(${name})`;
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

export async function createWalletUser(data: {
  name: string; bscAddress: string;
  referralCode: string; sponsorId?: number; packageLevel: number;
  role?: string; status?: string;
}) {
  const sql = await getDb();
  const status = data.status ?? 'active';
  const role = data.role ?? 'member';
  const rows = await sql`
    INSERT INTO users (name, referral_code, sponsor_id, package_level, bsc_address, role, status)
    VALUES (${data.name}, ${data.referralCode}, ${data.sponsorId ?? null},
            ${data.packageLevel}, ${data.bscAddress}, ${role}, ${status})
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

// Atomic check-and-debit: the WHERE guard makes the balance check and the
// deduction a single database operation, so concurrent requests can't both
// pass a stale balance check before either one commits.
export async function deductWalletBalance(userId: number, amount: number): Promise<boolean> {
  const sql = await getDb();
  const rows = await sql`
    UPDATE users SET wallet_balance = wallet_balance - ${amount}
    WHERE id = ${userId} AND wallet_balance >= ${amount}
    RETURNING id
  `;
  return rows.length > 0;
}

// Sliding-window rate limit backed by Postgres so it works correctly across
// serverless instances (an in-memory counter would reset per cold start and
// wouldn't be shared between concurrent function invocations).
export async function checkRateLimit(
  key: string, maxAttempts: number, windowSeconds: number,
): Promise<boolean> {
  const sql = await getDb();
  await sql`INSERT INTO rate_limit_attempts (key) VALUES (${key})`;

  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM rate_limit_attempts
    WHERE key = ${key} AND created_at > NOW() - (${windowSeconds} || ' seconds')::interval
  `;

  // Opportunistic cleanup — avoids unbounded table growth without a cron job.
  if (Math.random() < 0.01) {
    await sql`DELETE FROM rate_limit_attempts WHERE created_at < NOW() - INTERVAL '1 day'`;
  }

  return Number(rows[0].count) <= maxAttempts;
}

export async function addEarning(userId: number, type: string, amount: number, sourceUserId?: number, description?: string) {
  const sql = await getDb();
  await sql`
    INSERT INTO earnings (user_id, type, amount, source_user_id, description, on_chain)
    VALUES (${userId}, ${type}, ${amount}, ${sourceUserId ?? null}, ${description ?? null}, false)
  `;
  await sql`
    UPDATE users SET wallet_balance = wallet_balance + ${amount}, total_earned = total_earned + ${amount}
    WHERE id = ${userId}
  `;
}

export async function recordEarning(userId: number, type: string, amount: number, sourceUserId?: number, description?: string) {
  const sql = await getDb();
  await sql`
    INSERT INTO earnings (user_id, type, amount, source_user_id, description, on_chain)
    VALUES (${userId}, ${type}, ${amount}, ${sourceUserId ?? null}, ${description ?? null}, true)
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

export async function getEarningsBySource(userId: number) {
  const sql = await getDb();
  return await sql`
    SELECT source_user_id, SUM(amount) as total FROM earnings
    WHERE user_id = ${userId} AND source_user_id IS NOT NULL
    GROUP BY source_user_id
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

export async function promoteToAdmin(userId: number) {
  const sql = await getDb();
  await sql`UPDATE users SET role = 'admin' WHERE id = ${userId}`;
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
  const [byDay, earningsByType, txByType, packageDistribution] = await Promise.all([
    sql`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM users WHERE role != 'admin'
      GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30
    `,
    sql`SELECT type, SUM(amount) as total FROM earnings GROUP BY type`,
    // status = 'completed' — rejected/failed withdrawals are refunded in full and never
    // actually moved, so they'd otherwise inflate the withdrawal volume bar.
    sql`SELECT type, COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM transactions
        WHERE status = 'completed' GROUP BY type`,
    sql`SELECT package_level, COUNT(*) as count FROM users
        WHERE role != 'admin' AND package_level > 0 GROUP BY package_level`,
  ]);
  return { byDay: [...byDay].reverse(), earningsByType, txByType, packageDistribution };
}
