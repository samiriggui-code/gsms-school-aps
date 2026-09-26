/**
 * Phase 4 — connecte le moteur de règles Q1 à Evidence / EvidenceIndicatorLink.
 *
 * NE remplace PAS evaluateSessionQualiopi (qui reste read-only, contrat inchangé —
 * cf. son disclaimer). Cette fonction est un pas séparé et explicite : on lui passe
 * un payload déjà calculé, elle matérialise les PASS déterministes en Evidence.
 *
 * N'est appelée nulle part automatiquement pour l'instant (pas branchée sur la route
 * GET /evaluate, ni sur un event SD-06) — décision volontairement laissée ouverte
 * (à quel moment déclencher l'écriture : à chaque stress-test ? sur SESSION_STATUS_CHANGED ?
 * uniquement sur action utilisateur explicite ?). Voir handoff.
 *
 * Idempotent : upsert via immutableReference `qualiopi-auto:{sessionId}:{indicatorCode}`.
 */

import type { PrismaClient } from '@repo/database';
import { getIndicatorMode } from './qualiopi-indicator-mapping-registry';
import type { QualiopiSessionEvaluatePayload } from './qualiopi-evaluation-types';

export type EvidenceSyncOutcome = {
  indicatorCode: string;
  synced: boolean;
  reason: 'PASS_AUTO' | 'NOT_PASS' | 'NOT_AUTO_MODE';
};

function indicatorNumberFromCode(code: string): number {
  return Number(code.replace('Q-I', ''));
}

/**
 * Matérialise en Evidence les indicateurs AUTO évalués PASS dans un payload
 * déjà produit par evaluateSessionQualiopi. Ignore FAIL/WARNING/NOT_APPLICABLE/
 * NOT_VERIFIABLE (une non-conformité n'est pas une preuve) et les indicateurs
 * non-AUTO (HYBRID/MANUAL restent hors de ce mécanisme, cf. spec §23).
 */
export async function syncAutoEvidenceFromEvaluation(
  prisma: PrismaClient,
  payload: QualiopiSessionEvaluatePayload,
): Promise<EvidenceSyncOutcome[]> {
  const outcomes: EvidenceSyncOutcome[] = [];

  for (const evaluation of payload.evaluations) {
    if (evaluation.status !== 'PASS') {
      outcomes.push({ indicatorCode: evaluation.indicatorCode, synced: false, reason: 'NOT_PASS' });
      continue;
    }

    const mode = getIndicatorMode(indicatorNumberFromCode(evaluation.indicatorCode));
    if (mode !== 'AUTO') {
      outcomes.push({ indicatorCode: evaluation.indicatorCode, synced: false, reason: 'NOT_AUTO_MODE' });
      continue;
    }

    const immutableReference = `qualiopi-auto:${payload.targetId}:${evaluation.indicatorCode}`;
    const metadata = {
      rulesVersion: payload.rulesVersion,
      referentialVersion: payload.referentialVersion,
      reasonCode: evaluation.reasonCode,
      expected: evaluation.expected,
      observed: evaluation.observed,
      evaluatedAt: payload.evaluatedAt,
    };

    const evidence = await prisma.evidence.upsert({
      where: { immutableReference },
      create: {
        category: 'QUALIOPI_AUTO_EVIDENCE',
        sourceType: 'DATABASE_RECORD',
        sourceId: payload.targetId,
        status: 'VALID',
        immutableReference,
        sessionId: payload.targetId,
        eventName: `QUALIOPI_AUTO_EVAL_${evaluation.indicatorCode}`,
        metadata,
      },
      update: {
        status: 'VALID',
        metadata,
      },
    });

    await prisma.evidenceIndicatorLink.upsert({
      where: {
        evidenceId_indicatorCode: {
          evidenceId: evidence.id,
          indicatorCode: evaluation.indicatorCode,
        },
      },
      create: {
        evidenceId: evidence.id,
        indicatorCode: evaluation.indicatorCode,
        status: 'AUTO',
        reason: evaluation.explanation,
      },
      update: {
        status: 'AUTO',
        reason: evaluation.explanation,
      },
    });

    outcomes.push({ indicatorCode: evaluation.indicatorCode, synced: true, reason: 'PASS_AUTO' });
  }

  return outcomes;
}
