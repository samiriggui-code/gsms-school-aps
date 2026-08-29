import type { PrismaClient } from '@repo/database';
import {
  QUALIOPI_INDICATORS_V9,
  QUALIOPI_REFERENTIAL_VERSION,
  type QualiopiIndicator,
} from '@/lib/of/qualiopi-indicators';

export type QualiopiCoverageEvidence = {
  id: string;
  category: string;
  sourceType: string;
  status: string;
  eventName: string | null;
  createdAt: string;
};

export type QualiopiCoverageRow = QualiopiIndicator & {
  evidenceCount: number;
  latestEvidence: QualiopiCoverageEvidence | null;
  covered: boolean;
};

export type QualiopiCoveragePayload = {
  referentialVersion: string;
  totalIndicators: number;
  coveredCount: number;
  uncoveredCount: number;
  coveragePct: number;
  indicators: QualiopiCoverageRow[];
};

/** G9 — couverture des 32 indicateurs via EvidenceIndicatorLink (pas de migration legacy). */
export async function buildQualiopiCoverage(
  prisma: PrismaClient,
): Promise<QualiopiCoveragePayload> {
  const links = await prisma.evidenceIndicatorLink.findMany({
    include: {
      evidence: {
        select: {
          id: true,
          category: true,
          sourceType: true,
          status: true,
          eventName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const byCode = new Map<string, typeof links>();
  for (const link of links) {
    const list = byCode.get(link.indicatorCode) ?? [];
    list.push(link);
    byCode.set(link.indicatorCode, list);
  }

  const indicators: QualiopiCoverageRow[] = QUALIOPI_INDICATORS_V9.map((ind) => {
    const related = byCode.get(ind.code) ?? [];
    const latest = related[0]?.evidence;
    return {
      ...ind,
      evidenceCount: related.length,
      covered: related.length > 0,
      latestEvidence: latest
        ? {
            id: latest.id,
            category: latest.category,
            sourceType: latest.sourceType,
            status: latest.status,
            eventName: latest.eventName,
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
    };
  });

  const coveredCount = indicators.filter((i) => i.covered).length;
  const totalIndicators = indicators.length;

  return {
    referentialVersion: QUALIOPI_REFERENTIAL_VERSION,
    totalIndicators,
    coveredCount,
    uncoveredCount: totalIndicators - coveredCount,
    coveragePct: totalIndicators
      ? Math.round((coveredCount / totalIndicators) * 100)
      : 0,
    indicators,
  };
}
