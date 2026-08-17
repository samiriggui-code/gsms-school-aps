/**
 * Déduplique User.proEmail puis aligne le schéma (@unique).
 * Usage (racine monorepo, DATABASE_URL chargé) :
 *   node --env-file=.env packages/database/prisma/scripts/dedupe-proemail.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, 'dedupe-proemail.sql');

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error('DATABASE_URL manquant.');
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, 'utf8');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('OK — proEmail dédupliqué + index unique User_proEmail_key.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Échec dedupe proEmail:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
