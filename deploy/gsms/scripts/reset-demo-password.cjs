/** Reset password comptes démo → demo1234. DATABASE_URL requis. */
const bcrypt = require('bcrypt');
const { Client } = require('pg');

const targets =
  process.argv.length > 2
    ? process.argv.slice(2)
    : ['samir.iggui@ecole.local', 'yassine.hidjeb@ecole.local'];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL requis');
    process.exit(1);
  }
  const hash = await bcrypt.hash('demo1234', 10);
  const client = new Client({ connectionString: url });
  await client.connect();
  for (const email of targets) {
    const r = await client.query(
      `UPDATE "User" SET password = $1, "updatedAt" = NOW()
       WHERE "proEmail" = $2 OR email = $2
       RETURNING id, email, "proEmail"`,
      [hash, email],
    );
    console.log(email, r.rowCount ? `OK ${r.rows[0].id}` : 'NOT_FOUND');
  }
  await client.end();
  console.log('DONE password=demo1234');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
