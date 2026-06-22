/**
 * Fusionne les RhPosition dupliquées (même libellé).
 * Usage:
 *   pnpm db:dedupe-rh-positions
 *   DRY_RUN=1 pnpm db:dedupe-rh-positions   # audit sans écriture
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

function loadRootEnv() {
  const candidates = [
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    break;
  }
}

loadRootEnv();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require(path.join(__dirname, '../../generated/client'));
const {
  listRhPositionDuplicateGroups,
  dedupeRhPositions,
} = require('../data/dedupe-rh-positions');

const dryRun =
  process.env.DRY_RUN === '1' ||
  process.env.DRY_RUN === 'true' ||
  process.argv.includes('--dry-run');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const before = await listRhPositionDuplicateGroups(prisma);

  console.log(`[dedupe-rh-positions] ${before.totalPositions} poste(s) en base`);
  if (!before.duplicateGroups.length) {
    console.log('[dedupe-rh-positions] Aucun doublon détecté — rien à faire.');
    return;
  }

  console.log(`[dedupe-rh-positions] ${before.duplicateGroups.length} groupe(s) de doublons :`);
  for (const group of before.duplicateGroups) {
    const keeper = group.keeper;
    console.log(
      `  • "${keeper.label}" — garder ${keeper.id.slice(0, 8)}… (code=${keeper.code ?? '∅'}, users=${keeper._count.users}, org=${keeper._count.orgUnits})`,
    );
    for (const orphan of group.orphans) {
      console.log(
        `      ↳ supprimer ${orphan.id.slice(0, 8)}… (code=${orphan.code ?? '∅'}, users=${orphan._count.users}, org=${orphan._count.orgUnits})`,
      );
    }
  }

  if (dryRun) {
    console.log('[dedupe-rh-positions] DRY_RUN — aucune modification écrite.');
    return;
  }

  const stats = await dedupeRhPositions(prisma, { dryRun: false });
  const after = await listRhPositionDuplicateGroups(prisma);

  console.log('[dedupe-rh-positions] Terminé :');
  console.log(`  groupes traités     : ${stats.groupsProcessed}`);
  console.log(`  postes supprimés    : ${stats.positionsDeleted}`);
  console.log(`  users réassignés    : ${stats.usersReassigned}`);
  console.log(`  orgUnits réassignés : ${stats.orgUnitsReassigned}`);
  console.log(`  keepers enrichis    : ${stats.keepersEnriched}`);
  console.log(`  postes restants     : ${after.totalPositions}`);
  console.log(`  doublons restants   : ${after.duplicateGroups.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
