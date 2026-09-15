import { getDb, getConnectionString } from '../../src/server/db/client.ts';
import { users } from '../../src/server/db/schema.ts';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('connStr:', getConnectionString());
  const db = getDb();
  const rows = await db.select({ n: sql`count(*)::int` }).from(users);
  console.log('users count via drizzle pool:', rows[0].n);
  process.exit(0);
}

main().catch((e) => {
  console.error('FAIL:', e);
  process.exit(1);
});
