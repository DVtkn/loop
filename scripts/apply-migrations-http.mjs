// One-off: apply drizzle migrations 0001/0002 over Neon HTTP driver (TCP blocked locally)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const url = 'postgresql://neondb_owner:npg_x5zSfevkjlo0@ep-winter-moon-b1gv1vb3-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(url);

const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));

for (const entry of journal.entries) {
  const file = `drizzle/${entry.tag}.sql`;
  const content = readFileSync(file, 'utf8');
  const hash = createHash('sha256').update(content).digest('hex');

  if (entry.idx === 0) {
    // Tables already exist — only register in bookkeeping
    await sql.query('CREATE SCHEMA IF NOT EXISTS drizzle');
    await sql.query('CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)');
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

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`;
console.log('final tables:', tables.map((t) => t.table_name).join(', '));
