import {
  CandidatureStatus,
  FormationExamOutcome,
  Prisma,
  RhTeamLifecycleStatus,
  UserStatus,
  type PrismaClient,
} from '@repo/database';

type Db = PrismaClient | Prisma.TransactionClient;

const SESSION_MODERATE_PERMISSION = 'chat.session.moderate';

/** Intitulé affiché : nom de la formation (+ période session si connue). */
export function buildSessionTeamDisplayName(session: {
  formation: { name: string };
  dateDisplayLabel?: string | null;
}): string {
  const formationName = session.formation.name.trim();
  const dateLabel = session.dateDisplayLabel?.trim();
  return dateLabel ? `${formationName} — ${dateLabel}` : formationName;
}

/** Sous-titre équipe / chat : composition pédagogique liée à la session. */
export function buildSessionTeamDescription(session: {
  dateDisplayLabel?: string | null;
}): string {
  const dateLabel = session.dateDisplayLabel?.trim();
  return dateLabel
    ? `Équipe pédagogique · Session ${dateLabel}`
    : 'Équipe pédagogique · Session de formation';
}

async function findDefaultModeratorUserId(db: Db): Promise<string | null> {
  const user = await db.user.findFirst({
    where: {
      status: UserStatus.ACTIVE,
      isTrashed: false,
      role: {
        permissions: {
          some: { permission: { slug: SESSION_MODERATE_PERMISSION } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function assertModeratorEligible(db: Db, userId: string): Promise<boolean> {
  const n = await db.user.count({
    where: {
      id: userId,
      status: UserStatus.ACTIVE,
      isTrashed: false,
      role: {
        permissions: {
          some: { permission: { slug: SESSION_MODERATE_PERMISSION } },
        },
      },
    },
  });
  return n === 1;
}

async function resolveSessionModeratorId(
  db: Db,
  sessionId: string,
  currentModeratorId: string | null | undefined,
  override?: string | null,
): Promise<string | null> {
  let moderatorUserId = override ?? currentModeratorId ?? null;
  if (moderatorUserId && !(await assertModeratorEligible(db, moderatorUserId))) {
    moderatorUserId = null;
  }
  if (!moderatorUserId) {
    moderatorUserId = await findDefaultModeratorUserId(db);
    if (moderatorUserId) {
      await db.formationSession.update({
        where: { id: sessionId },
        data: { moderatorUserId },
      });
    }
  }
  return moderatorUserId;
}

/**
 * Crée ou synchronise l'équipe RH pédagogique d'une session :
 * formateur (chef) + élèves inscrits + modérateur pédagogique.
 * Ne s'applique pas aux équipes en cycle ARCHIVED.
 */
export async function ensureSessionTeam(
  db: Db,
  sessionId: string,
  options?: { moderatorUserId?: string | null },
): Promise<string | null> {
  const session = await db.formationSession.findUnique({
    where: { id: sessionId },
    include: {
      formation: { select: { name: true } },
      participants: { select: { userId: true } },
      rhTeam: { select: { id: true, lifecycleStatus: true } },
      chatConversation: { select: { id: true, rhTeamId: true } },
    },
  });

  if (!session) return null;

  if (session.rhTeam?.lifecycleStatus === RhTeamLifecycleStatus.ARCHIVED) {
    return session.rhTeam.id;
  }

  const moderatorUserId = await resolveSessionModeratorId(
    db,
    sessionId,
    session.moderatorUserId,
    options?.moderatorUserId,
  );

  const teamName = buildSessionTeamDisplayName(session);
  const teamDescription = buildSessionTeamDescription(session);

  let teamId = session.rhTeam?.id ?? null;

  if (!teamId) {
    const existing = await db.rhTeam.findUnique({
      where: { formationSessionId: sessionId },
      select: { id: true, lifecycleStatus: true },
    });
    if (existing) {
      teamId = existing.id;
      if (existing.lifecycleStatus === RhTeamLifecycleStatus.ARCHIVED) {
        return teamId;
      }
    }
  }

  if (!teamId) {
    const created = await db.rhTeam.create({
      data: {
        name: teamName,
        description: teamDescription,
        type: 'PEDAGOGICAL',
        sector: 'CAMPUS',
        formationSessionId: sessionId,
        leaderId: session.trainerUserId,
        lifecycleStatus: RhTeamLifecycleStatus.ACTIVE,
      },
    });
    teamId = created.id;
  } else {
    await db.rhTeam.update({
      where: { id: teamId },
      data: {
        name: teamName,
        description: teamDescription,
        leaderId: session.trainerUserId,
        formationSessionId: sessionId,
      },
    });
  }

  const memberIds = new Set<string>();
  if (session.trainerUserId) memberIds.add(session.trainerUserId);
  if (moderatorUserId) memberIds.add(moderatorUserId);
  for (const p of session.participants) memberIds.add(p.userId);

  for (const userId of memberIds) {
    await db.rhTeamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }

  const staleMembers = await db.rhTeamMember.findMany({
    where: {
      teamId,
      userId: { notIn: [...memberIds] },
    },
    select: { id: true, userId: true },
  });

  const protectedIds = new Set(
    [session.trainerUserId, moderatorUserId].filter((id): id is string => Boolean(id)),
  );

  for (const row of staleMembers) {
    if (protectedIds.has(row.userId)) continue;
    await db.rhTeamMember.delete({ where: { id: row.id } });
  }

  if (session.chatConversation?.id) {
    await db.chatConversation.update({
      where: { id: session.chatConversation.id },
      data: { rhTeamId: teamId },
    });
  }

  return teamId;
}

/** Retire un apprenant des espaces session et désactive son compte (archivage dossier). */
export async function revokeArchivedLearnerAccess(
  db: Db,
  userId: string,
  candidatureId: string,
): Promise<void> {
  const enrollments = await db.formationSessionParticipant.findMany({
    where: { candidatureId },
    select: {
      userId: true,
      session: {
        select: {
          id: true,
          rhTeam: { select: { id: true } },
          chatConversation: { select: { id: true } },
        },
      },
    },
  });

  for (const enrollment of enrollments) {
    const teamId = enrollment.session.rhTeam?.id;
    if (teamId) {
      await db.rhTeamMember.deleteMany({ where: { teamId, userId } });
    }
    const conversationId = enrollment.session.chatConversation?.id;
    if (conversationId) {
      await db.chatParticipant.deleteMany({ where: { conversationId, userId } });
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { status: UserStatus.INACTIVE },
  });

  const sessionIds = [...new Set(enrollments.map((e) => e.session.id))];
  for (const sessionId of sessionIds) {
    await maybeFinalizeSessionTeam(db, sessionId);
  }
}

/** Passe l'équipe en POST_EXAM après la date d'examen ou quand tous les élèves ont un résultat. */
export async function maybeAdvanceSessionTeamToPostExam(
  db: Db,
  sessionId: string,
): Promise<void> {
  const session = await db.formationSession.findUnique({
    where: { id: sessionId },
    include: {
      rhTeam: { select: { id: true, lifecycleStatus: true } },
      participants: {
        select: { examOutcome: true, candidature: { select: { status: true } } },
      },
    },
  });

  if (!session?.rhTeam || session.rhTeam.lifecycleStatus !== RhTeamLifecycleStatus.ACTIVE) {
    return;
  }

  const now = new Date();
  const examDatePassed = session.examDate ? session.examDate <= now : false;
  const learners = session.participants.filter((p) => p.candidature);
  const allExamined =
    learners.length > 0 &&
    learners.every((p) => p.examOutcome !== FormationExamOutcome.PENDING);

  if (!examDatePassed && !allExamined) return;

  await db.rhTeam.update({
    where: { id: session.rhTeam.id },
    data: {
      lifecycleStatus: RhTeamLifecycleStatus.POST_EXAM,
      lifecycleClosedAt: now,
    },
  });
}

/** Clôture l'équipe quand tous les dossiers liés sont archivés ou rejetés. */
export async function maybeFinalizeSessionTeam(
  db: Db,
  sessionId: string,
): Promise<void> {
  const session = await db.formationSession.findUnique({
    where: { id: sessionId },
    include: {
      rhTeam: { select: { id: true, lifecycleStatus: true } },
      participants: {
        select: {
          candidature: { select: { status: true } },
        },
      },
    },
  });

  if (!session?.rhTeam) return;
  if (session.rhTeam.lifecycleStatus === RhTeamLifecycleStatus.ARCHIVED) return;

  const terminal: CandidatureStatus[] = [
    CandidatureStatus.ARCHIVED,
    CandidatureStatus.REJECTED,
  ];

  const withDossier = session.participants.filter((p) => p.candidature);
  if (withDossier.length === 0) return;

  const allTerminal = withDossier.every((p) =>
    terminal.includes(p.candidature!.status),
  );

  if (!allTerminal) return;

  await db.rhTeam.update({
    where: { id: session.rhTeam.id },
    data: {
      lifecycleStatus: RhTeamLifecycleStatus.ARCHIVED,
      lifecycleClosedAt: new Date(),
    },
  });
}

export type SessionTeamLifecycleSweepResult = {
  sessionsScanned: number;
  postExamTeams: number;
  archivedTeams: number;
};

/** Sweep planifié : avance POST_EXAM puis ARCHIVED sur les équipes de session. */
export async function sweepSessionTeamLifecycle(
  prisma: PrismaClient,
): Promise<SessionTeamLifecycleSweepResult> {
  const sessions = await prisma.formationSession.findMany({
    where: {
      rhTeam: {
        lifecycleStatus: {
          in: [RhTeamLifecycleStatus.ACTIVE, RhTeamLifecycleStatus.POST_EXAM],
        },
      },
    },
    select: { id: true, rhTeam: { select: { lifecycleStatus: true } } },
  });

  let postExamTeams = 0;
  let archivedTeams = 0;

  for (const session of sessions) {
    const before = session.rhTeam?.lifecycleStatus;
    await maybeAdvanceSessionTeamToPostExam(prisma, session.id);
    const afterAdvance = await prisma.rhTeam.findFirst({
      where: { formationSessionId: session.id },
      select: { lifecycleStatus: true },
    });
    if (
      before === RhTeamLifecycleStatus.ACTIVE &&
      afterAdvance?.lifecycleStatus === RhTeamLifecycleStatus.POST_EXAM
    ) {
      postExamTeams += 1;
    }

    const beforeFinalize = afterAdvance?.lifecycleStatus;
    await maybeFinalizeSessionTeam(prisma, session.id);
    const afterFinalize = await prisma.rhTeam.findFirst({
      where: { formationSessionId: session.id },
      select: { lifecycleStatus: true },
    });
    if (
      beforeFinalize !== RhTeamLifecycleStatus.ARCHIVED &&
      afterFinalize?.lifecycleStatus === RhTeamLifecycleStatus.ARCHIVED
    ) {
      archivedTeams += 1;
    }
  }

  return {
    sessionsScanned: sessions.length,
    postExamTeams,
    archivedTeams,
  };
}

/** Provisionne ou resynchronise les équipes de session (nom formation + membres). */
export async function provisionMissingSessionTeams(
  prisma: PrismaClient,
  limit = 50,
): Promise<number> {
  const rows = await prisma.formationSession.findMany({
    where: {
      OR: [
        { rhTeam: null },
        {
          rhTeam: {
            lifecycleStatus: { not: RhTeamLifecycleStatus.ARCHIVED },
          },
        },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: { id: true },
  });

  let provisioned = 0;
  for (const row of rows) {
    const teamId = await ensureSessionTeam(prisma, row.id);
    if (teamId) provisioned += 1;
  }
  return provisioned;
}
