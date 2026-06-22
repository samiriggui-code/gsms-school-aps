/**
 * Audit fiches staff — postes, qualifications, pôles, specialties formateur.
 * Usage: node packages/database/prisma/scripts/audit-staff-metier.js
 */
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

const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require(path.join(__dirname, '../../generated/client'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function auditGaps(u) {
  const gaps = [];
  if (!u.jobPositionId) gaps.push('poste (RhPosition)');
  if (!u.jobFunction?.trim()) gaps.push('jobFunction');
  if (!u.qualification?.trim()) gaps.push('qualification');
  const pole =
    u.collaborateurProfile?.schoolInternalService ??
    u.formateurProfile?.schoolInternalService ??
    null;
  if (!pole && ['collaborateur', 'formateur', 'admin', 'superadmin'].includes(u.role.slug)) {
    gaps.push('pôle interne');
  }
  const specialties = u.formateurProfile?.specialties;
  const specArr = Array.isArray(specialties) ? specialties : [];
  if (u.role.slug === 'formateur' && specArr.length === 0) gaps.push('specialties[]');
  return gaps;
}

async function main() {
  const staff = await prisma.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      role: { slug: { in: ['collaborateur', 'formateur', 'admin', 'superadmin'] } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      jobFunction: true,
      jobPositionId: true,
      qualification: true,
      userCategory: true,
      role: { select: { slug: true } },
      jobPosition: { select: { code: true, label: true, schoolInternalService: true } },
      collaborateurProfile: {
        select: { schoolInternalService: true, jobFunction: true, qualification: true },
      },
      formateurProfile: {
        select: { schoolInternalService: true, specialties: true, speciality: true },
      },
    },
    orderBy: [{ role: { slug: 'asc' } }, { createdAt: 'asc' }],
  });

  const rows = staff.map((u) => {
    const pole =
      u.collaborateurProfile?.schoolInternalService ??
      u.formateurProfile?.schoolInternalService ??
      null;
    const specialties = u.formateurProfile?.specialties;
    const specArr = Array.isArray(specialties) ? specialties : [];
    const gaps = auditGaps(u);
    return {
      role: u.role.slug,
      name: u.name,
      email: u.email,
      pole: pole ?? '—',
      poste: u.jobPosition?.label ?? u.jobFunction ?? '—',
      positionCode: u.jobPosition?.code ?? '—',
      qualification: u.qualification ?? '—',
      specialties: u.role.slug === 'formateur' ? specArr.join(', ') || '—' : '—',
      ok: gaps.length === 0,
      gaps,
    };
  });

  const incomplete = rows.filter((r) => !r.ok);
  const byPole = {};
  for (const r of rows) {
    byPole[r.pole] = (byPole[r.pole] ?? 0) + 1;
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  AUDIT FICHES COLLABORATEUR / FORMATEUR');
  console.log('══════════════════════════════════════════════════\n');
  console.log(`Total staff actif : ${rows.length}`);
  console.log(`Fiches complètes  : ${rows.length - incomplete.length}`);
  console.log(`Fiches incomplètes  : ${incomplete.length}`);
  console.log('\nRépartition par pôle :');
  for (const [pole, count] of Object.entries(byPole).sort()) {
    console.log(`  • ${pole} : ${count}`);
  }

  console.log('\n── Détail par personne ──\n');
  for (const r of rows) {
    const status = r.ok ? '✓' : '✗';
    console.log(`${status} [${r.role}] ${r.name}`);
    console.log(`    Email    : ${r.email}`);
    console.log(`    Pôle     : ${r.pole}`);
    console.log(`    Poste    : ${r.poste} (${r.positionCode})`);
    console.log(`    Qualif.  : ${r.qualification}`);
    if (r.role === 'formateur') console.log(`    Domaines : ${r.specialties}`);
    if (r.gaps.length) console.log(`    Manque   : ${r.gaps.join(', ')}`);
    console.log('');
  }

  if (incomplete.length === 0) {
    console.log('✅ Toutes les fiches staff sont complètes.\n');
  } else {
    console.log(`⚠️  ${incomplete.length} fiche(s) à compléter — relancer pnpm db:seed\n`);
    process.exitCode = 1;
  }
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
