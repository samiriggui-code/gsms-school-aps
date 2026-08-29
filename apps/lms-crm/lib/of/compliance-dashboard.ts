import type { PrismaClient } from '@repo/database';
import {
  FundingCaseStatus,
  FundingFunderType,
  SubcontractorQualificationStatus,
} from '@repo/database';
import { buildQualiopiCoverage } from '@/lib/of/qualiopi-coverage';
import { buildEdofDossierChecklist } from '@/lib/connectors/edof/edof-dossier-checklist';
import {
  buildOpcoDossierChecklist,
  isOpcoChecklistEligibleProvider,
} from '@/lib/connectors/opco/opco-dossier-checklist';
import { buildFtKairosDossierChecklist } from '@/lib/connectors/france-travail/kairos-dossier-checklist';

export type ComplianceDashboardPayload = {
  qualiopi: {
    coveragePct: number;
    coveredCount: number;
    uncoveredCount: number;
    totalIndicators: number;
    uncoveredCodes: string[];
  };
  subcontractors: {
    total: number;
    byStatus: Record<string, number>;
  };
  disabilityReferent: {
    configured: boolean;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  funding: {
    total: number;
    byStatus: Record<string, number>;
    checklistsDue: {
      edof: { casesWithDue: number; dueSteps: number };
      opco: { casesWithDue: number; dueSteps: number };
      ftKairos: { casesWithDue: number; dueSteps: number };
    };
  };
};

const SUB_STATUSES = Object.values(SubcontractorQualificationStatus);
const FUNDING_STATUSES = Object.values(FundingCaseStatus);

/** Agrégat lecture seule — tableau de bord conformité organisme (pas d’écriture). */
export async function buildComplianceDashboard(
  prisma: PrismaClient,
): Promise<ComplianceDashboardPayload> {
  const [coverage, subByStatus, settings, fundingByStatus, fundingCases] =
    await Promise.all([
      buildQualiopiCoverage(prisma),
      prisma.subcontractorRecord.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.systemSetting.findFirst({
        orderBy: { id: 'asc' },
        select: {
          disabilityReferentName: true,
          disabilityReferentEmail: true,
          disabilityReferentPhone: true,
        },
      }),
      prisma.fundingCase.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.fundingCase.findMany({
        where: {
          funderType: {
            in: [
              FundingFunderType.CPF,
              FundingFunderType.OPCO,
              FundingFunderType.FRANCE_TRAVAIL,
            ],
          },
          status: { notIn: [FundingCaseStatus.CANCELLED, FundingCaseStatus.CLOSED] },
        },
        take: 300,
        select: {
          id: true,
          status: true,
          funderType: true,
          provider: { select: { code: true, label: true } },
          documents: { select: { id: true, code: true, status: true } },
        },
      }),
    ]);

  const subMap: Record<string, number> = Object.fromEntries(
    SUB_STATUSES.map((s) => [s, 0]),
  );
  let subTotal = 0;
  for (const row of subByStatus) {
    subMap[row.status] = row._count._all;
    subTotal += row._count._all;
  }

  const fundingMap: Record<string, number> = Object.fromEntries(
    FUNDING_STATUSES.map((s) => [s, 0]),
  );
  let fundingTotal = 0;
  for (const row of fundingByStatus) {
    fundingMap[row.status] = row._count._all;
    fundingTotal += row._count._all;
  }

  const checklistsDue = {
    edof: { casesWithDue: 0, dueSteps: 0 },
    opco: { casesWithDue: 0, dueSteps: 0 },
    ftKairos: { casesWithDue: 0, dueSteps: 0 },
  };

  for (const fc of fundingCases) {
    if (fc.funderType === FundingFunderType.CPF) {
      const steps = buildEdofDossierChecklist({
        caseStatus: fc.status,
        documents: fc.documents,
      });
      const due = steps.filter((s) => s.state === 'due').length;
      if (due > 0) {
        checklistsDue.edof.casesWithDue += 1;
        checklistsDue.edof.dueSteps += due;
      }
      continue;
    }

    if (fc.funderType === FundingFunderType.OPCO) {
      if (!isOpcoChecklistEligibleProvider(fc.provider)) continue;
      const steps = buildOpcoDossierChecklist({
        caseStatus: fc.status,
        documents: fc.documents,
      });
      const due = steps.filter((s) => s.state === 'due').length;
      if (due > 0) {
        checklistsDue.opco.casesWithDue += 1;
        checklistsDue.opco.dueSteps += due;
      }
      continue;
    }

    if (fc.funderType === FundingFunderType.FRANCE_TRAVAIL) {
      const steps = buildFtKairosDossierChecklist({
        caseStatus: fc.status,
        documents: fc.documents,
      });
      const due = steps.filter((s) => s.state === 'due').length;
      if (due > 0) {
        checklistsDue.ftKairos.casesWithDue += 1;
        checklistsDue.ftKairos.dueSteps += due;
      }
    }
  }

  const name = settings?.disabilityReferentName?.trim() || null;

  return {
    qualiopi: {
      coveragePct: coverage.coveragePct,
      coveredCount: coverage.coveredCount,
      uncoveredCount: coverage.uncoveredCount,
      totalIndicators: coverage.totalIndicators,
      uncoveredCodes: coverage.indicators.filter((i) => !i.covered).map((i) => i.code),
    },
    subcontractors: { total: subTotal, byStatus: subMap },
    disabilityReferent: {
      configured: Boolean(name),
      name,
      email: settings?.disabilityReferentEmail ?? null,
      phone: settings?.disabilityReferentPhone ?? null,
    },
    funding: {
      total: fundingTotal,
      byStatus: fundingMap,
      checklistsDue,
    },
  };
}
