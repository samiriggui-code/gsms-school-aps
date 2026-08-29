/**
 * One-shot — backfill Evidence + EvidenceIndicatorLink pour items SCHOOL_QUALIOPI
 * déjà VALIDATED/WAIVED avant le branchement G9 (pas de route API).
 *
 * Usage (racine monorepo) :
 *   pnpm -C apps/lms-crm exec tsx --env-file=../../.env ./scripts/backfill-qualiopi-evidence.ts
 */
import { prisma } from '../lib/prisma';
import { buildQualiopiCoverage } from '../lib/of/qualiopi-coverage';
import { recordStatusEvidence } from '../lib/evidence/record-status-evidence';

async function main() {
  const before = await buildQualiopiCoverage(prisma);

  const items = await prisma.complianceDossierItem.findMany({
    where: {
      status: { in: ['VALIDATED', 'WAIVED'] },
      dossier: { kind: 'SCHOOL_QUALIOPI' },
    },
    select: {
      id: true,
      code: true,
      status: true,
      fileAssetId: true,
      dossierId: true,
    },
  });

  const nowIso = new Date().toISOString();
  let backfilled = 0;
  let skippedAlreadyLinked = 0;

  for (const item of items) {
    const existing = await prisma.evidence.findFirst({
      where: {
        sourceId: item.id,
        eventName: 'COMPLIANCE_ITEM_STATUS_CHANGED',
      },
      select: { id: true },
    });
    if (existing) {
      skippedAlreadyLinked += 1;
      continue;
    }

    await recordStatusEvidence(prisma, {
      category: 'qualiopi_item',
      sourceType: item.fileAssetId ? 'DOCUMENT' : 'VALIDATION',
      sourceId: item.id,
      eventName: 'COMPLIANCE_ITEM_STATUS_CHANGED',
      fromStatus: null,
      toStatus: item.status,
      indicatorCodes: item.code ? [item.code] : undefined,
      metadata: {
        indicatorCode: item.code,
        dossierId: item.dossierId,
        backfilled: true,
        backfilledAt: nowIso,
      },
    });
    backfilled += 1;
  }

  const after = await buildQualiopiCoverage(prisma);

  console.log(
    JSON.stringify(
      {
        itemsSatisfied: items.length,
        backfilled,
        skippedAlreadyLinked,
        coverageBefore: {
          pct: before.coveragePct,
          covered: before.coveredCount,
          uncovered: before.uncoveredCount,
          total: before.totalIndicators,
        },
        coverageAfter: {
          pct: after.coveragePct,
          covered: after.coveredCount,
          uncovered: after.uncoveredCount,
          total: after.totalIndicators,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
