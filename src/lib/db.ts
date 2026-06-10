import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'boldgains.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      referral_code TEXT UNIQUE NOT NULL,
      sponsor_id INTEGER,
      package_level INTEGER DEFAULT 0,
      wallet_balance REAL DEFAULT 0,
      total_earned REAL DEFAULT 0,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sponsor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      fee REAL DEFAULT 0,
      net_amount REAL NOT NULL,
      description TEXT,
      reference TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS earnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      source_user_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);
    CREATE INDEX IF NOT EXISTS idx_users_sponsor ON users(sponsor_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_earnings_user ON earnings(user_id);
  `);

  const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('Wealth@2026', 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, referral_code, role, package_level, wallet_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('Admin', 'admin@boldgains.com', hash, 'ADMIN001', 'admin', 11, 0);
  }
}

export function getUserByEmail(email: string) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function getUserById(id: number) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}

export function getUserByReferralCode(code: string) {
  return getDb().prepare('SELECT * FROM users WHERE referral_code = ?').get(code) as any;
}

export function createUser(data: {
  name: string; email: string; passwordHash: string;
  referralCode: string; sponsorId?: number; packageLevel: number;
}) {
  const result = getDb().prepare(`
    INSERT INTO users (name, email, password_hash, referral_code, sponsor_id, package_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.name, data.email, data.passwordHash, data.referralCode, data.sponsorId ?? null, data.packageLevel);
  return result.lastInsertRowid as number;
}

export function updateUserPackage(userId: number, packageLevel: number) {
  getDb().prepare('UPDATE users SET package_level = ? WHERE id = ?').run(packageLevel, userId);
}

export function updateWalletBalance(userId: number, amount: number) {
  getDb().prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, userId);
}

export function addEarning(userId: number, type: string, amount: number, sourceUserId?: number, description?: string) {
  getDb().prepare(`
    INSERT INTO earnings (user_id, type, amount, source_user_id, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, type, amount, sourceUserId ?? null, description ?? null);
  getDb().prepare('UPDATE users SET wallet_balance = wallet_balance + ?, total_earned = total_earned + ? WHERE id = ?')
    .run(amount, amount, userId);
}

export function createTransaction(data: {
  userId: number; type: string; amount: number; fee: number;
  netAmount: number; description?: string; reference?: string; status?: string;
}) {
  return getDb().prepare(`
    INSERT INTO transactions (user_id, type, amount, fee, net_amount, description, reference, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.userId, data.type, data.amount, data.fee, data.netAmount,
    data.description ?? null, data.reference ?? null, data.status ?? 'completed').lastInsertRowid;
}

export function getUserTransactions(userId: number, limit = 20) {
  return getDb().prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
  `).all(userId, limit) as any[];
}

export function getUserEarnings(userId: number) {
  return getDb().prepare(`
    SELECT e.*, u.name as source_name FROM earnings e
    LEFT JOIN users u ON e.source_user_id = u.id
    WHERE e.user_id = ? ORDER BY e.created_at DESC LIMIT 50
  `).all(userId) as any[];
}

export function getUserEarningsSummary(userId: number) {
  return getDb().prepare(`
    SELECT type, SUM(amount) as total FROM earnings WHERE user_id = ? GROUP BY type
  `).all(userId) as any[];
}

export function getDirectDownlines(userId: number) {
  return getDb().prepare(`
    SELECT id, name, email, referral_code, package_level, total_earned, created_at
    FROM users WHERE sponsor_id = ?
  `).all(userId) as any[];
}

export function getNetworkStats(userId: number) {
  const direct = getDb().prepare('SELECT COUNT(*) as count FROM users WHERE sponsor_id = ?').get(userId) as any;
  const allDownlines = getNetworkCount(userId);
  return { directCount: direct.count, totalNetwork: allDownlines };
}

function getNetworkCount(userId: number, depth = 0): number {
  if (depth > 10) return 0;
  const children = getDb().prepare('SELECT id FROM users WHERE sponsor_id = ?').all(userId) as any[];
  let count = children.length;
  for (const child of children) count += getNetworkCount(child.id, depth + 1);
  return count;
}

export function getAllUsers() {
  return getDb().prepare(`
    SELECT u.*, s.name as sponsor_name FROM users u
    LEFT JOIN users s ON u.sponsor_id = s.id
    ORDER BY u.created_at DESC
  `).all() as any[];
}

export function getSystemStats() {
  const db2 = getDb();
  const totalUsers = (db2.prepare('SELECT COUNT(*) as c FROM users WHERE role != ?').get('admin') as any).c;
  const totalVolume = (db2.prepare('SELECT SUM(amount) as s FROM transactions WHERE type = ?').get('deposit') as any).s || 0;
  const totalEarnings = (db2.prepare('SELECT SUM(amount) as s FROM earnings').get() as any).s || 0;
  const activePackages = (db2.prepare('SELECT COUNT(*) as c FROM users WHERE package_level > 0').get() as any).c;
  const suspended = (db2.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'suspended'").get() as any).c;
  const pendingWithdrawals = (db2.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='withdrawal' AND status='pending'").get() as any).c;
  const pendingVolume = (db2.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='withdrawal' AND status='pending'").get() as any).s;
  return { totalUsers, totalVolume, totalEarnings, activePackages, suspended, pendingWithdrawals, pendingVolume };
}

export function setUserStatus(userId: number, status: 'active' | 'suspended') {
  getDb().prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
}

export function adminSetPackage(userId: number, packageLevel: number) {
  getDb().prepare('UPDATE users SET package_level = ? WHERE id = ?').run(packageLevel, userId);
}

export function adminAdjustBalance(userId: number, amount: number, adminId: number, reason: string) {
  getDb().prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, userId);
  getDb().prepare(`
    INSERT INTO transactions (user_id, type, amount, fee, net_amount, description, status)
    VALUES (?, 'admin_adjustment', ?, 0, ?, ?, 'completed')
  `).run(userId, Math.abs(amount), amount, `Admin: ${reason}`);
}

export function deleteUser(userId: number) {
  const db2 = getDb();
  db2.prepare('DELETE FROM earnings WHERE user_id = ?').run(userId);
  db2.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
  db2.prepare('UPDATE users SET sponsor_id = NULL WHERE sponsor_id = ?').run(userId);
  db2.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

export function getAllTransactions(limit = 100) {
  return getDb().prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC LIMIT ?
  `).all(limit) as any[];
}

export function approveWithdrawal(txId: number) {
  getDb().prepare("UPDATE transactions SET status = 'completed' WHERE id = ?").run(txId);
}

export function rejectWithdrawal(txId: number) {
  const tx = getDb().prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
  if (!tx) return;
  getDb().prepare("UPDATE transactions SET status = 'rejected' WHERE id = ?").run(txId);
  getDb().prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(tx.amount, tx.user_id);
}

export function getGrowthData() {
  const db2 = getDb();
  const byDay = db2.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as count
    FROM users WHERE role != 'admin'
    GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30
  `).all() as any[];
  const earningsByType = db2.prepare(`
    SELECT type, SUM(amount) as total FROM earnings GROUP BY type
  `).all() as any[];
  const txByType = db2.prepare(`
    SELECT type, COUNT(*) as count, COALESCE(SUM(amount),0) as total
    FROM transactions GROUP BY type
  `).all() as any[];
  return { byDay: byDay.reverse(), earningsByType, txByType };
}
