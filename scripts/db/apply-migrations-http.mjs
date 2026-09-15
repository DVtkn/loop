// Idempotent: apply only drizzle migrations not yet registered in drizzle.__drizzle_migrations
// (over Neon HTTP driver, since local TCP 5432 is blocked)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const url = 'postgresql://neondb_owner:npg_x5zSfevkjlo0@ep-winter-moon-b1gv1vb3-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(url);

await sql.query('CREATE SCHEMA IF NOT EXISTS drizzle');
await sql.query('CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)');

// De-duplicate any double-registered rows from earlier runs (keep lowest id per hash)
await sql.query(`DELETE FROM drizzle.__drizzle_migrations a USING drizzle.__drizzle_migrations b WHERE a.id > b.id AND a.hash = b.hash`);

const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));
const registered = new Set((await sql`SELECT hash FROM drizzle.__drizzle_migrations`).map((r) => r.hash));

for (const entry of journal.entries) {
  const content = readFileSync(`drizzle/${entry.tag}.sql`, 'utf8');
  const hash = createHash('sha256').update(content).digest('hex');
  if (registered.has(hash)) {
    console.log(`[${entry.tag}] already applied — skipped`);
    continue;
  }
  if (entry.idx === 0) {
    // Base migration: tables already exist in prod — register only
    console.log(`[${entry.tag}] registered only (tables exist)`);
  } else {
    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await sql.query(stmt);
    }
    console.log(`[${entry.tag}] applied ${statements.length} statements`);
  }
  await sql.query('INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)', [hash, entry.when]);
}

const cc = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='couple_reports' ORDER BY ordinal_position`;
console.log('couple_reports cols:', cc.map((c) => c.column_name).join(', '));
const ta = await sql`SELECT data_type FROM information_schema.columns WHERE table_name='test_answers' AND column_name='selected_value'`;
console.log('test_answers.selected_value:', ta[0]?.data_type);
