import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const url = 'postgresql://neondb_owner:npg_x5zSfevkjlo0@ep-winter-moon-b1gv1vb3-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(url);

async function run() {
  // Read and execute 0006
  const content = readFileSync('./drizzle/0006_update_couple_pets.sql', 'utf8');
  const statements = content
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    console.log('Executing:', stmt.substring(0, 80) + '...');
    try {
      // Use sql`` tagged template for DDL
      await sql.unsafe(stmt);
      console.log('  OK');
    } catch (e) {
      console.error('  ERROR:', e.message);
    }
  }
  
  // Verify
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='couple_pets' ORDER BY ordinal_position`;
  console.log('\ncouple_pets columns:');
  for(const c of cols) console.log(`  ${c.column_name}: ${c.data_type}`);
}

run().catch(console.error);