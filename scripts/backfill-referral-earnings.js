// One-time backfill: historical registration referral_bonus transactions were
// never written to the `earnings` table, so they've never shown up in
// Earnings Breakdown / My Earnings / admin reports. This inserts a matching
// `earnings` row for each one, using the amount that was actually paid
// on-chain under the old 50%-direct-only rule. No new on-chain payments are
// made — bookkeeping only. Safe to re-run: each inserted row is tagged with
// a [backfill:tx#<id>] marker and already-tagged transactions are skipped.
//
// Usage: node scripts/backfill-referral-earnings.js

require('dotenv').config({ quiet: true });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

function extractName(description) {
  const m = /—\s*(.+?)\s+registered/.exec(description || '');
  return m ? m[1] : null;
}

async function attributeSource(sponsorId, name, paidAt) {
  const candidates = await sql`
    SELECT id, name FROM users WHERE sponsor_id = ${sponsorId} AND name = ${name}
  `;
  if (candidates.length === 1) return candidates[0].id;
  if (candidates.length === 0) return null;

  // Multiple users share this name under the same sponsor — disambiguate by
  // closest preceding registration timestamp.
  let best = null;
  let bestDelta = Infinity;
  for (const c of candidates) {
    const [reg] = await sql`
      SELECT created_at FROM transactions
      WHERE user_id = ${c.id} AND type = 'registration'
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!reg) continue;
    const delta = new Date(paidAt) - new Date(reg.created_at);
    if (delta >= 0 && delta < bestDelta) { bestDelta = delta; best = c.id; }
  }
  return best;
}

async function main() {
  const rows = await sql`
    SELECT * FROM transactions
    WHERE type = 'referral_bonus' AND status != 'failed'
    ORDER BY id
  `;

  console.log(`Found ${rows.length} historical referral_bonus transactions.\n`);

  let inserted = 0;
  let skipped = 0;

  for (const tx of rows) {
    const marker = `[backfill:tx#${tx.id}]`;
    const [existing] = await sql`
      SELECT id FROM earnings WHERE description LIKE ${'%' + marker}
    `;
    if (existing) {
      console.log(`skip  tx#${tx.id} — already backfilled`);
      skipped++;
      continue;
    }

    const name = extractName(tx.description);
    const sourceUserId = name ? await attributeSource(tx.user_id, name, tx.created_at) : null;
    const amount = Number(tx.net_amount);
    const description = `${tx.description} ${marker}`;

    await sql`
      INSERT INTO earnings (user_id, type, amount, source_user_id, description, created_at)
      VALUES (${tx.user_id}, 'referral_bonus', ${amount}, ${sourceUserId}, ${description}, ${tx.created_at})
    `;
    await sql`UPDATE users SET total_earned = total_earned + ${amount} WHERE id = ${tx.user_id}`;

    console.log(
      `insert tx#${tx.id} — sponsor ${tx.user_id}, $${amount.toFixed(4)}, ` +
      `source: ${sourceUserId ? `user ${sourceUserId} (${name})` : `unattributed (${name || 'no name parsed'})`}`
    );
    inserted++;
  }

  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped} (already backfilled).`);
}

main().catch(err => { console.error(err); process.exit(1); });
