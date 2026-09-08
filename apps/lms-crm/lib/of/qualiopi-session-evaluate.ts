/**
 * Stress test Qualiopi session — lecture seule.
 * Charge les faits métier + EvidenceIndicatorLink, exécute les règles pilotes Q1.
 * Aucune écriture Prisma.
 */

import type { PrismaClient } from '@repo/database';
import { QUALIOPI_REFERENTIAL_VERSION } from '@/lib/of/qualiopi-indicators';
import {
  QUALIOPI_Q1_PILOT_RULES,
  type SessionEvaluateFacts,
  type SessionParticipantFact,
} from '@/lib/of/qualiopi-evaluation-rules';
import {
  QUALIOPI_ENGINE_RULES_VERSION,
  QualiopiSessionNotFoundError,
  type QualiopiEvaluationSummary,
  type QualiopiSessionEvaluatePayload,
} from '@/lib/of/qualiopi-evaluation-types';

const PILOT_INDICATOR_CODES = ['Q-I08', 'Q-I11', 'Q-I30', 'Q-I20', 'Q-I26', 'Q-I27'] as const;

async function loadEvidenceRefs(
  prisma: PrismaClient,
  sessionId: string,
): Promise<Map<string, string[]>> {
  const links = await prisma.evidenceIndicatorLink.findMany({
    where: {
      indicatorCode: { in: [...PILOT_INDICATOR_CODES] },
      OR: [
        { evidence: { sessionId } },
        { evidence: { sessionId: null } },
      ],
    },
    select: {
      evidenceId: true,
      indicatorCode: true,
      evidence: { select: { sessionId: true } },
    },
    take: 500,
  });

  const map = new Map<string, string[]>();
  for (const link of links) {
    // Preuves session + preuves org (sessionId null) pour I20/I26/I27
    const isOrg = link.evidence.sessionId == null;
    const isSession = link.evidence.sessionId === sessionId;
    if (!isOrg && !isSession) continue;
    const list = map.get(link.indicatorCode) ?? [];
    list.push(link.evidenceId);
    map.set(link.indicatorCode, list);
  }
  return map;
}

async function loadSessionFacts(
  prisma: PrismaClient,
  sessionId: string,
): Promise<SessionEvaluateFacts> {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      readinessStatus: true,
      startDate: true,
      endDate: true,
      formation: { select: { name: true } },
      participants: {
        select: {
          id: true,
          userId: true,
          enrollmentStatus: true,
          candidatureId: true,
          candidature: {
            select: {
              assessments: {
                where: { kind: { in: ['POSITIONING', 'NEEDS_ANALYSIS'] } },
                select: {
                  kind: true,
                  status: true,
                  adaptationStatus: true,
                },
              },
            },
          },
          formativeAssessments: { select: { id: true } },
        },
      },
      satisfactionSurveys: {
        select: {
          id: true,
          timing: true,
          status: true,
          participantId: true,
        },
      },
    },
  });

  if (!session) {
    throw new QualiopiSessionNotFoundError(sessionId);
  }

  const [settings, subcontractors, evidenceRefsByIndicator] = await Promise.all([
    prisma.systemSetting.findFirst({
      orderBy: { id: 'asc' },
      select: {
        disabilityReferentName: true,
        disabilityReferentEmail: true,
        disabilityReferentPhone: true,
      },
    }),
    prisma.subcontractorRecord.findMany({
      select: { id: true, label: true, status: true },
      take: 200,
    }),
    loadEvidenceRefs(prisma, sessionId),
  ]);

  const participants: SessionParticipantFact[] = session.participants.map((p) => {
    const assessments = p.candidature?.assessments ?? [];
    const positioning = assessments.find((a) => a.kind === 'POSITIONING');
    const needs = assessments.find((a) => a.kind === 'NEEDS_ANALYSIS');
    return {
      id: p.id,
      userId: p.userId,
      enrollmentStatus: p.enrollmentStatus,
      candidatureId: p.candidatureId,
      positioningStatus: positioning?.status ?? null,
      formativeCount: p.formativeAssessments.length,
      adaptationStatus: needs?.adaptationStatus ?? positioning?.adaptationStatus ?? null,
    };
  });

  return {
    sessionId: session.id,
    sessionLabel: session.dateDisplayLabel,
    formationName: session.formation.name,
    readinessStatus: session.readinessStatus,
    startDate: session.startDate,
    endDate: session.endDate,
    participants,
    satisfaction: session.satisfactionSurveys.map((s) => ({
      id: s.id,
      timing: s.timing,
      status: s.status,
      participantId: s.participantId,
    })),
    disabilityReferent: {
      name: settings?.disabilityReferentName ?? null,
      email: settings?.disabilityReferentEmail ?? null,
      phone: settings?.disabilityReferentPhone ?? null,
    },
    subcontractors: subcontractors.map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
    })),
    evidenceRefsByIndicator,
  };
}

function summarize(
  evaluations: QualiopiSessionEvaluatePayload['evaluations'],
): QualiopiEvaluationSummary {
  const summary: QualiopiEvaluationSummary = {
    pass: 0,
    fail: 0,
    warning: 0,
    notApplicable: 0,
    notVerifiable: 0,
    total: evaluations.length,
  };
  for (const ev of evaluations) {
    switch (ev.status) {
      case 'PASS':
        summary.pass += 1;
        break;
      case 'FAIL':
        summary.fail += 1;
        break;
      case 'WARNING':
        summary.warning += 1;
        break;
      case 'NOT_APPLICABLE':
        summary.notApplicable += 1;
        break;
      case 'NOT_VERIFIABLE':
        summary.notVerifiable += 1;
        break;
      default: {
        const _exhaustive: never = ev.status;
        void _exhaustive;
        break;
      }
    }
  }
  return summary;
}

/**
 * Évalue une session contre les règles pilotes Q1.
 * Read-only — n’écrit ni Evidence ni ComplianceDossierItem.
 */
export async function evaluateSessionQualiopi(
  prisma: PrismaClient,
  sessionId: string,
): Promise<QualiopiSessionEvaluatePayload> {
  const facts = await loadSessionFacts(prisma, sessionId.trim());

  const evaluations: QualiopiSessionEvaluatePayload['evaluations'] = [];
  const findings: QualiopiSessionEvaluatePayload['findings'] = [];

  for (const rule of QUALIOPI_Q1_PILOT_RULES) {
    const { evaluation, finding } = rule(facts);
    evaluations.push(evaluation);
    if (finding) findings.push(finding);
  }

  return {
    targetType: 'SESSION',
    targetId: facts.sessionId,
    evaluatedAt: new Date().toISOString(),
    rulesVersion: QUALIOPI_ENGINE_RULES_VERSION,
    referentialVersion: QUALIOPI_REFERENTIAL_VERSION,
    session: {
      id: facts.sessionId,
      label: facts.sessionLabel,
      formationName: facts.formationName,
      readinessStatus: facts.readinessStatus,
      startDate: facts.startDate?.toISOString() ?? null,
      endDate: facts.endDate?.toISOString() ?? null,
      participantCount: facts.participants.filter((p) => p.enrollmentStatus === 'CONFIRMED')
        .length,
    },
    summary: summarize(evaluations),
    evaluations,
    findings,
    disclaimer:
      'Évaluation déterministe Q1 (6 indicateurs pilotes). Read-only — ne constitue pas un audit Qualiopi officiel. CODE CALCULE ; EVE n’intervient pas.',
  };
}
