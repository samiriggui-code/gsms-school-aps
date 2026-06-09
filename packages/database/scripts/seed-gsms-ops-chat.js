#!/usr/bin/env node
/**
 * Crée ou met à jour le fil « GSMS Ops » — usage VPS one-shot :
 *   docker exec -w /app/packages/database gsms-crm node scripts/seed-gsms-ops-chat.js
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  for (const envPath of [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
    '/app/.env',
  ]) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
    break;
  }
}

loadEnv();

const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require('../generated/client');
const { seedGsmsOpsChat } = require('../prisma/data/gsms-ops-chat-seed');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const id = await seedGsmsOpsChat(prisma);
    if (id) {
      console.log('');
      console.log('Ajoutez dans /opt/gsms/.env :');
      console.log(`GSMS_OPS_CHAT_CONVERSATION_ID=${id}`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
