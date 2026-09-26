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

/** Statut du meilleur lien EvidenceIndicatorLink pour l’indicateur. */
export type QualiopiLinkAggregateStatus =
  | 'VERIFIED'
  | 'AUTO'
  | 'SUGGESTED'
  | 'REJECTED'
  | 'NONE';

export type QualiopiCoverageRow = QualiopiIndicator & {
  evidenceCount: number;
  latestEvidence: QualiopiCoverageEvidence | null;
  covered: boolean;
  /** Agrégat liens : VERIFIED > AUTO > SUGGESTED > REJECTED > NONE. */
  linkStatus: QualiopiLinkAggregateStatus;
  linkConfidence: number | null;
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

  const rank: Record<string, number> = {
    VERIFIED: 4,
    AUTO: 3,
    SUGGESTED: 2,
    REJECTED: 1,
  };

  const indicators: QualiopiCoverageRow[] = QUALIOPI_INDICATORS_V9.map((ind) => {
    const related = byCode.get(ind.code) ?? [];
    const latest = related[0]?.evidence;
    let linkStatus: QualiopiLinkAggregateStatus = 'NONE';
    let linkConfidence: number | null = null;
    for (const link of related) {
      const st = (link.status ?? 'SUGGESTED') as QualiopiLinkAggregateStatus;
      if ((rank[st] ?? 0) > (rank[linkStatus] ?? 0)) {
        linkStatus = st;
        linkConfidence = link.confidence ?? null;
      }
    }
    // Couvert si au moins un lien non rejeté
    const covered = related.some((l) => l.status !== 'REJECTED');
    return {
      ...ind,
      evidenceCount: related.length,
      covered,
      linkStatus: related.length === 0 ? 'NONE' : linkStatus,
      linkConfidence,
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
