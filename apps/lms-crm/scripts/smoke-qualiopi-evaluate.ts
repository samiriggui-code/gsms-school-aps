/**
 * Smoke Q1 evaluate — lecture seule.
 * Usage: pnpm exec tsx --env-file=../../.env scripts/smoke-qualiopi-evaluate.ts [sessionId]
 */
import { prisma } from '../lib/prisma';
import { evaluateSessionQualiopi } from '../lib/of/qualiopi-session-evaluate';
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

    const result = await evaluateSessionQualiopi(prisma, sessionId);
    console.log(
      JSON.stringify(
        {
          targetId: result.targetId,
          rulesVersion: result.rulesVersion,
          summary: result.summary,
          findings: result.findings.map((f) => ({
            code: f.indicatorCode,
            status: f.status,
            reason: f.reasonCode,
            action: f.actionTarget,
          })),
          evaluations: result.evaluations.map((e) => ({
            code: e.indicatorCode,
            status: e.status,
            reason: e.reasonCode,
          })),
        },
        null,
        2,
      ),
    );
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
