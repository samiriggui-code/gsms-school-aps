import type { PrismaClient } from '@repo/database';
import { buildQualiopiCoverage } from '@/lib/of/qualiopi-coverage';

export type QualiopiGapItem = {
  code: string;
  criterion: number;
  indicator: number;
  label: string;
  why: string;
  citations: { kind: 'indicator' | 'evidence'; id: string }[];
};

export type QualiopiGapsPayload = {
  question: string;
  disclaimer: string;
  uncoveredCount: number;
  coveredCount: number;
  totalIndicators: number;
  coveragePct: number;
  gaps: QualiopiGapItem[];
  answer: string;
};

/**
 * GSMS-AI-04 P0 — réponse déterministe (pas de LLM) à
 * « Qu’est-ce qui manque pour la couverture Qualiopi école ? »
 * Source unique : buildQualiopiCoverage(). Jamais d’écriture.
 */
export async function buildQualiopiCoverageGaps(
  prisma: PrismaClient,
): Promise<QualiopiGapsPayload> {
  const coverage = await buildQualiopiCoverage(prisma);
  const gaps: QualiopiGapItem[] = coverage.indicators
    .filter((ind) => !ind.covered)
    .map((ind) => ({
      code: ind.code,
      criterion: ind.criterion,
      indicator: ind.indicator,
      label: ind.label,
      why: 'Aucune preuve Evidence liée à cet indicateur (EvidenceIndicatorLink absent).',
      citations: [{ kind: 'indicator' as const, id: ind.code }],
    }));

  const answer =
    gaps.length === 0
      ? `Couverture Evidence complète : ${coverage.coveredCount}/${coverage.totalIndicators} indicateurs ont au moins une preuve liée. Ceci n’est pas un jugement d’audit OK/KO.`
      : `${gaps.length} indicateur(s) sans preuve Evidence liée (${coverage.coveredCount}/${coverage.totalIndicators} couverts, ${coverage.coveragePct} %). Liste ci-dessous — ceci n’est pas un jugement d’audit OK/KO.`;

  return {
    question: 'Qu’est-ce qui manque pour la couverture Qualiopi (école) ?',
    disclaimer:
      'Réponse déterministe basée sur EvidenceIndicatorLink uniquement. Ne constitue pas un audit Qualiopi ni une validation d’indicateur.',
    uncoveredCount: coverage.uncoveredCount,
    coveredCount: coverage.coveredCount,
    totalIndicators: coverage.totalIndicators,
    coveragePct: coverage.coveragePct,
    gaps,
    answer,
  };
}
