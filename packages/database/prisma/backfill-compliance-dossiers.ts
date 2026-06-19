/**
 * Backfill : instancie + évalue les dossiers conformité pour candidatures ouvertes.
 * Usage : pnpm db:backfill-compliance (racine monorepo)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/client';
import { ComplianceService } from '@repo/api-core/compliance-service';

const require = createRequire(import.meta.url);
const { seedComplianceDossiersForOpenCandidatures } = require('./data/compliance-templates-seed');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadRootEnv() {
  const candidates = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
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

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  await seedComplianceDossiersForOpenCandidatures(prisma);

  const service = new ComplianceService(prisma);
  const dossiers = await prisma.complianceDossier.findMany({ select: { id: true } });
  let evaluated = 0;
  for (const d of dossiers) {
    await service.evaluateDossier(d.id);
    evaluated += 1;
  }

  console.log(`Backfill conformité : ${evaluated} dossier(s) évalué(s).`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
