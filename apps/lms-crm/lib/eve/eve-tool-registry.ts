import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { buildBpfAggregates } from '@/lib/finance/bpf-aggregates';
import { buildQualiopiCoverage } from '@/lib/of/qualiopi-coverage';
import { nextSessionReadiness } from '@/lib/session/session-readiness-transitions';
import {
  CRM_PERMISSION,
  GOVERNANCE_PERMISSION,
  sessionHasPermission,
} from '@/lib/auth/crm-permissions';
import type { EveToolContext } from './eve-types';

function deny(reason: string) {
  return { error: reason };
}

function can(session: Session, slug: string) {
  return sessionHasPermission(session, slug);
}

/** Outils lecture seule EVE V1 — wrappers sur la logique métier existante. */
export function buildEveTools(ctx: EveToolContext) {
  const { prisma, session } = ctx;

  return {
    session_get_readiness: tool({
      description:
        'Lit le statut readiness SD-06 d\'une session de formation (statut actuel, prochain statut, derniers événements).',
      inputSchema: z.object({
        sessionId: z.string().uuid().describe('ID FormationSession'),
      }),
      execute: async ({ sessionId }) => {
        if (!can(session, CRM_PERMISSION.academiqueView)) {
          return deny('Permission academique.view requise.');
        }
        const row = await prisma.formationSession.findUnique({
          where: { id: sessionId },
          select: {
            id: true,
            dateDisplayLabel: true,
            readinessStatus: true,
            readinessEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        });
        if (!row) return deny('Session introuvable.');
        return {
          sessionId: row.id,
          label: row.dateDisplayLabel,
          readinessStatus: row.readinessStatus,
          nextStatus: nextSessionReadiness(row.readinessStatus),
          recentEvents: row.readinessEvents.map((e) => ({
            from: e.fromStatus,
            to: e.toStatus,
            forced: e.forced,
            at: e.createdAt.toISOString(),
          })),
        };
      },
    }),

    sessions_count_tomorrow: tool({
      description:
        'Compte les sessions de formation dont la date de début est demain (fuseau serveur).',
      inputSchema: z.object({}),
      execute: async () => {
        if (!can(session, CRM_PERMISSION.academiqueView)) {
          return deny('Permission academique.view requise.');
        }
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayStart = new Date(tomorrow);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(tomorrow);
        dayEnd.setHours(23, 59, 59, 999);

        const sessions = await prisma.formationSession.findMany({
          where: { startDate: { gte: dayStart, lte: dayEnd } },
          select: {
            id: true,
            dateDisplayLabel: true,
            startDate: true,
            formation: { select: { name: true } },
          },
          orderBy: { startDate: 'asc' },
          take: 20,
        });

        return {
          date: dayStart.toISOString().slice(0, 10),
          count: sessions.length,
          sessions: sessions.map((s) => ({
            id: s.id,
            label: s.dateDisplayLabel,
            formation: s.formation.name,
            startDate: s.startDate?.toISOString() ?? null,
          })),
        };
      },
    }),

    qualiopi_get_coverage: tool({
      description:
        'Couverture Evidence des 32 indicateurs Qualiopi V9 (pourcentage, compteurs).',
      inputSchema: z.object({}),
      execute: async () => {
        if (!can(session, GOVERNANCE_PERMISSION.conformiteView)) {
          return deny('Permission governance.conformite.view requise.');
        }
        const data = await buildQualiopiCoverage(prisma);
        return {
          referentialVersion: data.referentialVersion,
          totalIndicators: data.totalIndicators,
          coveredCount: data.coveredCount,
          uncoveredCount: data.uncoveredCount,
          coveragePct: data.coveragePct,
        };
      },
    }),

    qualiopi_get_indicator: tool({
      description: 'Détail d\'un indicateur Qualiopi par code (ex. Q-I-1).',
      inputSchema: z.object({
        code: z.string().min(2).describe('Code indicateur, ex. Q-I-1'),
      }),
      execute: async ({ code }) => {
        if (!can(session, GOVERNANCE_PERMISSION.conformiteView)) {
          return deny('Permission governance.conformite.view requise.');
        }
        const data = await buildQualiopiCoverage(prisma);
        const ind = data.indicators.find(
          (i) => i.code.toLowerCase() === code.trim().toLowerCase(),
        );
        if (!ind) return deny(`Indicateur ${code} introuvable.`);
        return {
          code: ind.code,
          label: ind.label,
          criterion: ind.criterion,
          indicator: ind.indicator,
          covered: ind.covered,
          evidenceCount: ind.evidenceCount,
          latestEvidence: ind.latestEvidence,
        };
      },
    }),

    funding_get_case: tool({
      description: 'Lit un dossier de financement (statut, montants, financeur, pièces).',
      inputSchema: z.object({
        caseId: z.string().uuid().describe('ID FundingCase'),
      }),
      execute: async ({ caseId }) => {
        if (!can(session, CRM_PERMISSION.financeView)) {
          return deny('Permission finance.view requise.');
        }
        const fundingCase = await prisma.fundingCase.findUnique({
          where: { id: caseId },
          include: {
            provider: { select: { code: true, label: true } },
            documents: { select: { code: true, label: true, status: true } },
            events: { orderBy: { createdAt: 'desc' }, take: 5 },
            learnerUser: { select: { name: true, email: true } },
          },
        });
        if (!fundingCase) return deny('Dossier introuvable.');
        return {
          reference: fundingCase.reference,
          status: fundingCase.status,
          funderType: fundingCase.funderType,
          learner: fundingCase.learnerUser?.name ?? fundingCase.learnerUser?.email ?? null,
          provider: fundingCase.provider,
          requestedAmount: fundingCase.requestedAmount,
          approvedAmount: fundingCase.approvedAmount,
          currency: fundingCase.currency,
          documents: fundingCase.documents,
          recentEvents: fundingCase.events.map((e) => ({
            from: e.fromStatus,
            to: e.toStatus,
            at: e.createdAt.toISOString(),
          })),
        };
      },
    }),

    bpf_get_aggregates: tool({
      description: 'Agrégats BPF déterministes pour une année (stagiaires, heures, financement).',
      inputSchema: z.object({
        year: z.number().int().min(2000).max(2100).optional().describe('Année BPF (défaut: N-1)'),
      }),
      execute: async ({ year }) => {
        if (!can(session, CRM_PERMISSION.financeView)) {
          return deny('Permission finance.view requise.');
        }
        const current = new Date().getUTCFullYear();
        const y = year ?? current - 1;
        const aggregates = await buildBpfAggregates(prisma, y);
        return {
          year: aggregates.year,
          stagiairesCount: aggregates.stagiairesCount,
          sessionsCount: aggregates.sessionsCount,
          hoursCatalog: aggregates.hoursCatalog,
          hoursAttendedProxy: aggregates.hoursAttendedProxy,
          amountRequested: aggregates.amountRequested,
          amountApproved: aggregates.amountApproved,
          byFunderType: aggregates.byFunderType,
          controls: aggregates.controls,
        };
      },
    }),
  };
}

export type EveToolName = keyof ReturnType<typeof buildEveTools>;
