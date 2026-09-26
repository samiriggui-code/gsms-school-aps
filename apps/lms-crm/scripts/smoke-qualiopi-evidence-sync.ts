/**
 * Smoke Phase 4 — syncAutoEvidenceFromEvaluation.
 * ATTENTION : contrairement à smoke-qualiopi-evaluate.ts, ce script ÉCRIT en base
 * (upsert Evidence + EvidenceIndicatorLink pour les indicateurs AUTO évalués PASS).
 * Usage: pnpm exec tsx --env-file=../../.env scripts/smoke-qualiopi-evidence-sync.ts [sessionId]
 */
import { prisma } from '../lib/prisma';
import { evaluateSessionQualiopi } from '../lib/of/qualiopi-session-evaluate';
import { syncAutoEvidenceFromEvaluation } from '../lib/of/qualiopi-session-evidence-sync';
import { QualiopiSessionNotFoundError } from '../lib/of/qualiopi-evaluation-types';

async function main() {
  const arg = process.argv[2]?.trim();

  try {
    let sessionId = arg;
    if (!sessionId) {
      const row = await prisma.formationSession.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, dateDisplayLabel: true },
      });
      if (!row) {
        console.log('SMOKE_SKIP no FormationSession in DB');
        process.exit(0);
      }
      sessionId = row.id;
      console.log('Using latest session', row.id, row.dateDisplayLabel);
    }

    const evaluation = await evaluateSessionQualiopi(prisma, sessionId);
    const outcomes = await syncAutoEvidenceFromEvaluation(prisma, evaluation);

    console.log(JSON.stringify({ summary: evaluation.summary, outcomes }, null, 2));

    const links = await prisma.evidenceIndicatorLink.findMany({
      where: { evidence: { sessionId } },
      select: { indicatorCode: true, status: true, reason: true },
    });
    console.log('EvidenceIndicatorLink en base pour cette session :', JSON.stringify(links, null, 2));

    console.log('SMOKE_OK');
  } catch (e) {
    if (e instanceof QualiopiSessionNotFoundError) {
      console.error('SESSION_NOT_FOUND');
      process.exit(2);
    }
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
