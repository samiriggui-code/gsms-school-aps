import type { PrismaClient } from '@repo/database';
import { computeSessionMilestones } from './n8n-internal';
import { resolveParticipantFundingModeForN8n } from '../funding-mode';

export async function fetchSessionTimeline(prisma: PrismaClient, sessionId: string) {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    include: {
      formation: { select: { id: true, name: true, slug: true } },
      trainer: { select: { id: true, name: true, email: true } },
      moderator: { select: { id: true, name: true, email: true } },
      participants: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          candidature: {
            select: {
              id: true,
              status: true,
              notes: true,
              metadata: true,
              cnapsReference: true,
              cnapsPrefavorable: true,
            },
          },
        },
      },
      suiviDays: {
        orderBy: { dayDate: 'asc' },
        select: { id: true, dayDate: true },
      },
      formationExam: {
        select: { id: true, scheduledAt: true, status: true },
      },
    },
  });

  if (!session) return null;

  const startDate = session.startDate ?? null;
  const endDate = session.endDate ?? session.startDate ?? null;
  const milestones =
    startDate && endDate ? computeSessionMilestones(startDate, endDate) : [];

  return {
    sessionId: session.id,
    label: session.dateDisplayLabel,
    location: session.location,
    sessionKind: session.sessionKind,
    startDate: startDate?.toISOString() ?? null,
    endDate: endDate?.toISOString() ?? null,
    examDate: session.examDate?.toISOString() ?? session.formationExam?.scheduledAt?.toISOString() ?? null,
    formation: session.formation,
    trainer: session.trainer,
    moderator: session.moderator,
    milestones,
    participants: session.participants.map((p) => ({
      participantId: p.id,
      userId: p.userId,
      candidatureId: p.candidatureId,
      name: p.user.name ?? p.user.email,
      email: p.user.email,
      enrollmentStatus: p.enrollmentStatus,
      examOutcome: p.examOutcome,
      fundingMode: resolveParticipantFundingModeForN8n({
        participantFundingMode: p.fundingMode,
        candidatureNotes: p.candidature?.notes ?? null,
        candidatureMetadata: p.candidature?.metadata,
      }),
      fundingReference: p.fundingReference,
      candidatureStatus: p.candidature?.status ?? null,
    })),
    dayCount: session.suiviDays.length,
    exam: session.formationExam,
  };
}

export async function fetchCandidatureDossier(prisma: PrismaClient, candidatureId: string) {
  const row = await prisma.candidature.findUnique({
    where: { id: candidatureId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      formation: { select: { id: true, name: true, slug: true } },
      interestedSession: {
        select: { id: true, dateDisplayLabel: true, startDate: true, endDate: true },
      },
      complianceDossiers: {
        select: {
          id: true,
          kind: true,
          status: true,
          updatedAt: true,
        },
      },
      sessionEnrollments: {
        select: {
          id: true,
          sessionId: true,
          fundingMode: true,
          enrollmentStatus: true,
          session: { select: { id: true, dateDisplayLabel: true } },
        },
      },
      financeDevis: {
        select: {
          id: true,
          referenceCode: true,
          status: true,
          totalTtc: true,
          currency: true,
        },
      },
    },
  });

  if (!row) return null;

  const incompleteDossiers = row.complianceDossiers.filter((d) => d.status !== 'COMPLETE');

  return {
    candidatureId: row.id,
    status: row.status,
    source: row.source,
    candidateName: row.user.name ?? row.user.email,
    email: row.user.email,
    phone: row.user.phone,
    formation: row.formation,
    interestedSession: row.interestedSession,
    cnaps: {
      reference: row.cnapsReference,
      prefavorable: row.cnapsPrefavorable,
      submittedAt: row.cnapsSubmittedAt?.toISOString() ?? null,
      decisionAt: row.cnapsDecisionAt?.toISOString() ?? null,
    },
    documentsCompleteAt: row.documentsCompleteAt?.toISOString() ?? null,
    complianceDossiers: row.complianceDossiers,
    dossierComplete: incompleteDossiers.length === 0,
    incompleteDossierCount: incompleteDossiers.length,
    sessionEnrollments: row.sessionEnrollments,
    financeDevis: row.financeDevis,
  };
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

const PEDAGOGY_SLOTS = ['MORNING', 'EVENING'] as const;

/**
 * Alertes pédagogie du jour.
 * WF-17 : participants confirmés sans ligne d'émargement pour un créneau (jamais de preuve fabriquée).
 * WF-18 : absences ABSENT encore non justifiées.
 */
export async function fetchPedagogyDailyAlerts(prisma: PrismaClient, ref = new Date()) {
  const from = startOfUtcDay(ref);
  const to = endOfUtcDay(ref);

  const days = await prisma.formationSessionDay.findMany({
    where: { dayDate: { gte: from, lte: to } },
    include: {
      session: {
        select: {
          id: true,
          dateDisplayLabel: true,
          location: true,
          formation: { select: { name: true } },
          trainer: { select: { id: true, name: true, email: true, firstName: true, lastName: true } },
          participants: {
            where: { enrollmentStatus: 'CONFIRMED' },
            select: {
              id: true,
              user: { select: { id: true, name: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
      },
      attendances: {
        include: {
          participant: {
            include: {
              user: { select: { id: true, name: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  const sessionsToday = days.map((day) => {
    const markedKeys = new Set(
      day.attendances
        .filter((a) => a.markedAt != null || ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'].includes(a.status))
        .map((a) => `${a.participantId}:${a.slot}`),
    );

    const unsigned: Array<{
      participantId: string;
      slot: (typeof PEDAGOGY_SLOTS)[number];
      name: string;
      email: string | null;
    }> = [];

    for (const p of day.session.participants) {
      const name =
        p.user.name?.trim() ||
        [p.user.firstName, p.user.lastName].filter(Boolean).join(' ').trim() ||
        p.user.email;
      for (const slot of PEDAGOGY_SLOTS) {
        if (!markedKeys.has(`${p.id}:${slot}`)) {
          unsigned.push({
            participantId: p.id,
            slot,
            name,
            email: p.user.email?.trim() || null,
          });
        }
      }
    }

    const absences = day.attendances.filter(
      (a) =>
        a.status === 'ABSENT' &&
        (a.justificationStatus == null ||
          a.justificationStatus === 'UNJUSTIFIED' ||
          a.justificationStatus === 'JUSTIFICATION_REQUESTED'),
    );

    return {
      dayId: day.id,
      dayDate: day.dayDate.toISOString().slice(0, 10),
      sessionId: day.session.id,
      sessionLabel: day.session.dateDisplayLabel,
      formationName: day.session.formation.name,
      location: day.session.location,
      trainer: day.session.trainer,
      unsignedEmargementCount: unsigned.length,
      unjustifiedAbsenceCount: absences.length,
      unsigned,
      absences: absences.map((a) => ({
        emargementId: a.id,
        participantId: a.participantId,
        slot: a.slot,
        name:
          a.participant.user.name?.trim() ||
          [a.participant.user.firstName, a.participant.user.lastName].filter(Boolean).join(' ').trim() ||
          a.participant.user.email,
        email: a.participant.user.email?.trim() || null,
        justificationStatus: a.justificationStatus,
      })),
    };
  });

  return {
    date: from.toISOString().slice(0, 10),
    sessionCount: sessionsToday.length,
    sessions: sessionsToday,
    totalUnsigned: sessionsToday.reduce((n, s) => n + s.unsignedEmargementCount, 0),
    totalUnjustifiedAbsences: sessionsToday.reduce((n, s) => n + s.unjustifiedAbsenceCount, 0),
  };
}

export async function fetchComplianceDailyAlerts(prisma: PrismaClient) {
  const rows = await prisma.candidature.findMany({
    where: {
      status: { in: ['DRAFT', 'SUBMITTED', 'MISSING_DOCUMENTS', 'VALIDATION_PENDING', 'PENDING_CNAPS'] },
      archivedAt: null,
      complianceDossiers: { some: { status: 'INCOMPLETE' } },
    },
    take: 100,
    orderBy: { updatedAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      formation: { select: { id: true, name: true } },
      complianceDossiers: {
        where: { status: 'INCOMPLETE' },
        select: { id: true, kind: true, status: true },
      },
    },
  });

  return {
    count: rows.length,
    candidatures: rows.map((r) => ({
      candidatureId: r.id,
      status: r.status,
      candidateName: r.user.name ?? r.user.email,
      email: r.user.email,
      formation: r.formation,
      incompleteDossiers: r.complianceDossiers,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}
