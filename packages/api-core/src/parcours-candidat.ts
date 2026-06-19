import {
  Prisma,
  PrismaClient,
  CandidatureStatus,
  CandidatureSource,
  LeadStatus,
  FormationExamOutcome,
} from '@repo/database';
import {
  maybeAdvanceSessionTeamToPostExam,
  revokeArchivedLearnerAccess,
} from './session-team';

export type ParcoursStepId =
  | 'lead'
  | 'candidature'
  | 'validation'
  | 'session'
  | 'formation'
  | 'examen'
  | 'certification'
  | 'cloture';

export type ParcoursStep = {
  id: ParcoursStepId;
  label: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped' | 'blocked';
  detail?: string;
};

type Tx = Prisma.TransactionClient;

export async function syncLeadForCandidatureStatus(
  tx: Tx,
  candidatureId: string,
  status: CandidatureStatus,
) {
  const candidature = await tx.candidature.findUnique({
    where: { id: candidatureId },
    select: { leadId: true },
  });
  if (!candidature?.leadId) return;

  if (status === CandidatureStatus.VALIDATED || status === CandidatureStatus.COMPLETED) {
    await tx.lead.update({
      where: { id: candidature.leadId },
      data: { status: LeadStatus.CONVERTED },
    });
    return;
  }

  if (status === CandidatureStatus.REJECTED) {
    await tx.lead.update({
      where: { id: candidature.leadId },
      data: { status: LeadStatus.LOST },
    });
  }
}

export async function promoteUserToEleve(tx: Tx, userId: string) {
  const eleveRole = await tx.userRole.findFirst({
    where: { slug: 'eleve', isTrashed: false },
    select: { id: true },
  });
  if (!eleveRole) return false;
  await tx.user.update({
    where: { id: userId },
    data: { roleId: eleveRole.id },
  });
  return true;
}

export async function applyCandidatureStatusChange(
  tx: Tx,
  candidatureId: string,
  status: CandidatureStatus,
  existing?: { userId: string; status: CandidatureStatus },
) {
  const prev =
    existing ??
    (await tx.candidature.findUnique({
      where: { id: candidatureId },
      select: { userId: true, status: true },
    }));

  if (!prev) throw new Error('CANDIDATURE_NOT_FOUND');

  const data: Prisma.CandidatureUpdateInput = { status };

  if (status === CandidatureStatus.VALIDATED && prev.status !== CandidatureStatus.VALIDATED) {
    data.validatedAt = new Date();
  }
  if (status === CandidatureStatus.COMPLETED && prev.status !== CandidatureStatus.COMPLETED) {
    data.completedAt = new Date();
  }
  if (status === CandidatureStatus.ARCHIVED && prev.status !== CandidatureStatus.ARCHIVED) {
    data.archivedAt = new Date();
  }

  const updated = await tx.candidature.update({
    where: { id: candidatureId },
    data,
  });

  if (status === CandidatureStatus.VALIDATED) {
    await promoteUserToEleve(tx, prev.userId);
  }

  if (status === CandidatureStatus.ARCHIVED && prev.status !== CandidatureStatus.ARCHIVED) {
    await revokeArchivedLearnerAccess(tx, prev.userId, candidatureId);
  }

  await syncLeadForCandidatureStatus(tx, candidatureId, status);

  return updated;
}

export async function recordExamOutcome(
  tx: Tx,
  participantId: string,
  outcome: FormationExamOutcome,
  examDate?: Date | null,
) {
  const participant = await tx.formationSessionParticipant.findUnique({
    where: { id: participantId },
    select: { id: true, candidatureId: true, trainingCompletedAt: true, sessionId: true },
  });
  if (!participant) throw new Error('PARTICIPANT_NOT_FOUND');

  const row = await tx.formationSessionParticipant.update({
    where: { id: participantId },
    data: {
      examOutcome: outcome,
      examDate: examDate ?? new Date(),
      trainingCompletedAt:
        outcome === FormationExamOutcome.PASSED ? new Date() : participant.trainingCompletedAt,
    },
  });

  await maybeAdvanceSessionTeamToPostExam(tx, participant.sessionId);

  return row;
}

export async function issueFormationAttestation(
  tx: Tx,
  input: {
    userId: string;
    candidatureId: string;
    formationId: string;
    sessionId?: string | null;
    title: string;
    certificateUrl?: string | null;
    expiryDate?: Date | null;
  },
) {
  const attestation = await tx.formationAttestation.create({
    data: {
      userId: input.userId,
      candidatureId: input.candidatureId,
      formationId: input.formationId,
      sessionId: input.sessionId ?? null,
      title: input.title,
      certificateUrl: input.certificateUrl ?? null,
      expiryDate: input.expiryDate ?? null,
    },
  });

  if (input.sessionId) {
    await tx.formationSessionParticipant.updateMany({
      where: { sessionId: input.sessionId, candidatureId: input.candidatureId },
      data: { certifiedAt: new Date() },
    });
  }

  return attestation;
}

export async function completeCandidatureParcours(tx: Tx, candidatureId: string) {
  const candidature = await tx.candidature.findUnique({
    where: { id: candidatureId },
    select: {
      id: true,
      status: true,
      userId: true,
      attestations: { select: { id: true }, take: 1 },
      sessionEnrollments: {
        select: { examOutcome: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!candidature) throw new Error('CANDIDATURE_NOT_FOUND');
  if (candidature.status !== CandidatureStatus.VALIDATED) {
    throw new Error('CANDIDATURE_NOT_VALIDATED');
  }

  const lastEnrollment = candidature.sessionEnrollments[0];
  if (!lastEnrollment || lastEnrollment.examOutcome !== FormationExamOutcome.PASSED) {
    throw new Error('EXAM_NOT_PASSED');
  }
  if (candidature.attestations.length === 0) {
    throw new Error('ATTESTATION_REQUIRED');
  }

  return applyCandidatureStatusChange(tx, candidatureId, CandidatureStatus.COMPLETED, {
    userId: candidature.userId,
    status: candidature.status,
  });
}

export async function archiveCandidatureParcours(tx: Tx, candidatureId: string) {
  const candidature = await tx.candidature.findUnique({
    where: { id: candidatureId },
    select: { id: true, status: true, userId: true },
  });

  if (!candidature) throw new Error('CANDIDATURE_NOT_FOUND');

  const allowed: CandidatureStatus[] = [
    CandidatureStatus.COMPLETED,
    CandidatureStatus.REJECTED,
  ];
  if (!allowed.includes(candidature.status)) {
    throw new Error('CANNOT_ARCHIVE');
  }

  return applyCandidatureStatusChange(tx, candidatureId, CandidatureStatus.ARCHIVED, candidature);
}

export class CandidatureParcoursService {
  constructor(private prisma: PrismaClient) {}

  async getParcours(candidatureId: string) {
    const row = await this.prisma.candidature.findUnique({
      where: { id: candidatureId },
      include: {
        user: { select: { id: true, name: true, email: true, role: { select: { slug: true } } } },
        formation: { select: { id: true, name: true, slug: true } },
        interestedSession: { select: { id: true, dateDisplayLabel: true, startDate: true } },
        lead: { select: { id: true, status: true, source: true, createdAt: true } },
        sessionEnrollments: {
          orderBy: { createdAt: 'desc' },
          include: {
            session: {
              select: { id: true, dateDisplayLabel: true, startDate: true, endDate: true },
            },
          },
        },
        attestations: { orderBy: { issueDate: 'desc' }, take: 5 },
      },
    });

    if (!row) return null;

    const enrollment = row.sessionEnrollments[0] ?? null;
    const steps = this.buildSteps(row, enrollment);

    return {
      candidature: {
        id: row.id,
        status: row.status,
        source: row.source,
        validatedAt: row.validatedAt?.toISOString() ?? null,
        completedAt: row.completedAt?.toISOString() ?? null,
        archivedAt: row.archivedAt?.toISOString() ?? null,
      },
      user: row.user,
      formation: row.formation,
      interestedSession: row.interestedSession,
      lead: row.lead,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            examOutcome: enrollment.examOutcome,
            examDate: enrollment.examDate?.toISOString() ?? null,
            certifiedAt: enrollment.certifiedAt?.toISOString() ?? null,
            trainingCompletedAt: enrollment.trainingCompletedAt?.toISOString() ?? null,
            session: enrollment.session,
          }
        : null,
      attestations: row.attestations.map((a) => ({
        id: a.id,
        title: a.title,
        issueDate: a.issueDate.toISOString(),
        certificateUrl: a.certificateUrl,
      })),
      steps,
    };
  }

  private buildSteps(
    row: {
      status: CandidatureStatus;
      source: CandidatureSource;
      lead: { id: string } | null;
      validatedAt: Date | null;
      completedAt: Date | null;
      archivedAt: Date | null;
      attestations: { id: string }[];
    },
    enrollment: {
      examOutcome: FormationExamOutcome;
      certifiedAt: Date | null;
      trainingCompletedAt: Date | null;
    } | null,
  ): ParcoursStep[] {
    const terminal: CandidatureStatus[] = [CandidatureStatus.ARCHIVED, CandidatureStatus.REJECTED];
    const validatedStatuses: CandidatureStatus[] = [
      CandidatureStatus.VALIDATED,
      CandidatureStatus.COMPLETED,
      CandidatureStatus.ARCHIVED,
    ];
    const validatedOrAfter = validatedStatuses.includes(row.status);

    return [
      {
        id: 'lead',
        label: 'Lead / préinscription landing',
        status: row.lead ? 'done' : row.source === 'MANUAL' ? 'skipped' : 'pending',
      },
      {
        id: 'candidature',
        label: 'Dossier candidature',
        status: row.status === CandidatureStatus.DRAFT ? 'in_progress' : 'done',
      },
      {
        id: 'validation',
        label: 'Validation administrative',
        status: validatedOrAfter
          ? 'done'
          : terminal.includes(row.status)
            ? 'blocked'
            : 'in_progress',
      },
      {
        id: 'session',
        label: 'Inscription session',
        status: enrollment ? 'done' : validatedOrAfter ? 'in_progress' : 'pending',
      },
      {
        id: 'formation',
        label: 'Suivi formation',
        status: enrollment?.trainingCompletedAt
          ? 'done'
          : enrollment
            ? 'in_progress'
            : 'pending',
      },
      {
        id: 'examen',
        label: 'Examen',
        status:
          enrollment?.examOutcome === FormationExamOutcome.PASSED
            ? 'done'
            : enrollment?.examOutcome === FormationExamOutcome.FAILED ||
                enrollment?.examOutcome === FormationExamOutcome.ABSENT
              ? 'blocked'
              : enrollment
                ? 'in_progress'
                : 'pending',
      },
      {
        id: 'certification',
        label: 'Attestation / certification',
        status:
          row.attestations.length > 0
            ? 'done'
            : enrollment?.examOutcome === FormationExamOutcome.PASSED
              ? 'in_progress'
              : 'pending',
      },
      {
        id: 'cloture',
        label: 'Clôture dossier',
        status:
          row.status === CandidatureStatus.ARCHIVED
            ? 'done'
            : row.status === CandidatureStatus.COMPLETED
              ? 'in_progress'
              : 'pending',
      },
    ];
  }
}
