import { prisma } from '@/lib/prisma';
import { listInstructorSessions } from '@/lib/instructor/instructor-assignments-data';

export type InstructorAnnouncementRow = {
  id: string;
  formationId: string;
  formationName: string;
  sessionId: string | null;
  sessionLabel: string | null;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string;
  scope: 'formation' | 'session';
  state: 'draft' | 'scheduled' | 'live';
};

function announcementState(
  isPublished: boolean,
  publishedAt: Date,
  now: Date,
): InstructorAnnouncementRow['state'] {
  if (!isPublished) return 'draft';
  if (publishedAt > now) return 'scheduled';
  return 'live';
}

export async function listInstructorAnnouncements(
  trainerUserId: string,
): Promise<InstructorAnnouncementRow[]> {
  const sessions = await listInstructorSessions(trainerUserId);
  const formationIds = Array.from(new Set(sessions.map((s) => s.formation.id)));
  if (formationIds.length === 0) return [];

  const now = new Date();
  const rows = await prisma.portalSessionAnnouncement.findMany({
    where: { formationId: { in: formationIds } },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      formationId: true,
      sessionId: true,
      title: true,
      content: true,
      isPublished: true,
      publishedAt: true,
      formation: { select: { name: true } },
      session: { select: { dateDisplayLabel: true, trainerUserId: true } },
    },
  });

  return rows
    .filter((r) => !r.sessionId || r.session?.trainerUserId === trainerUserId)
    .map((r) => ({
      id: r.id,
      formationId: r.formationId,
      formationName: r.formation.name,
      sessionId: r.sessionId,
      sessionLabel: r.session?.dateDisplayLabel ?? null,
      title: r.title,
      content: r.content,
      isPublished: r.isPublished,
      publishedAt: r.publishedAt.toISOString(),
      scope: r.sessionId ? ('session' as const) : ('formation' as const),
      state: announcementState(r.isPublished, r.publishedAt, now),
    }));
}

async function resolveTraineeUserIds(input: {
  formationId: string;
  sessionId: string | null;
  trainerUserId: string;
}): Promise<string[]> {
  if (input.sessionId) {
    const participants = await prisma.formationSessionParticipant.findMany({
      where: { sessionId: input.sessionId },
      select: { userId: true },
    });
    return participants.map((p) => p.userId);
  }

  const sessionIds = await prisma.formationSession.findMany({
    where: { formationId: input.formationId, trainerUserId: input.trainerUserId },
    select: { id: true },
  });

  if (sessionIds.length === 0) return [];

  const participants = await prisma.formationSessionParticipant.findMany({
    where: { sessionId: { in: sessionIds.map((s) => s.id) } },
    select: { userId: true },
  });

  return Array.from(new Set(participants.map((p) => p.userId)));
}

export async function notifyTraineesForAnnouncement(input: {
  formationId: string;
  sessionId: string | null;
  trainerUserId: string;
  title: string;
  content: string;
  announcementId: string;
}) {
  const userIds = await resolveTraineeUserIds(input);
  if (userIds.length === 0) return 0;

  const body =
    input.content.length > 240 ? `${input.content.slice(0, 237).trim()}…` : input.content;

  await prisma.inAppNotification.createMany({
    data: userIds.map((userId) => ({
      userId,
      category: 'ACADEMIC',
      title: input.title,
      body,
      href: '/e-formation?tab=annonces',
      metadata: {
        kind: 'portal-announcement',
        announcementId: input.announcementId,
        formationId: input.formationId,
        sessionId: input.sessionId,
      },
    })),
  });

  return userIds.length;
}

export async function assertInstructorCanManageAnnouncement(
  trainerUserId: string,
  formationId: string,
  sessionId: string | null,
): Promise<{ ok: true } | { ok: false; message: string; status: number }> {
  const ownsSession = await prisma.formationSession.findFirst({
    where: { formationId, trainerUserId },
    select: { id: true },
  });
  if (!ownsSession) {
    return { ok: false, message: 'Formation non assignée.', status: 403 };
  }

  if (sessionId) {
    const session = await prisma.formationSession.findFirst({
      where: { id: sessionId, trainerUserId, formationId },
      select: { id: true },
    });
    if (!session) {
      return { ok: false, message: 'Session non assignée.', status: 403 };
    }
  }

  return { ok: true };
}

export type CreateInstructorAnnouncementInput = {
  formationId: string;
  sessionId?: string | null;
  title: string;
  content: string;
  isPublished?: boolean;
  publishedAt?: string | null;
};

export async function createInstructorAnnouncement(
  trainerUserId: string,
  input: CreateInstructorAnnouncementInput,
): Promise<InstructorAnnouncementRow> {
  const access = await assertInstructorCanManageAnnouncement(
    trainerUserId,
    input.formationId,
    input.sessionId ?? null,
  );
  if (!access.ok) throw new Error(access.message);

  const isPublished = input.isPublished ?? true;
  const publishedAt = input.publishedAt
    ? new Date(input.publishedAt)
    : new Date();

  const row = await prisma.portalSessionAnnouncement.create({
    data: {
      formationId: input.formationId,
      sessionId: input.sessionId?.trim() || null,
      title: input.title.trim(),
      content: input.content.trim(),
      isPublished,
      publishedAt,
    },
    select: {
      id: true,
      formationId: true,
      sessionId: true,
      title: true,
      content: true,
      isPublished: true,
      publishedAt: true,
      formation: { select: { name: true } },
      session: { select: { dateDisplayLabel: true } },
    },
  });

  const now = new Date();
  const state = announcementState(row.isPublished, row.publishedAt, now);

  if (state === 'live') {
    await notifyTraineesForAnnouncement({
      formationId: row.formationId,
      sessionId: row.sessionId,
      trainerUserId,
      title: row.title,
      content: row.content,
      announcementId: row.id,
    });
  }

  return {
    id: row.id,
    formationId: row.formationId,
    formationName: row.formation.name,
    sessionId: row.sessionId,
    sessionLabel: row.session?.dateDisplayLabel ?? null,
    title: row.title,
    content: row.content,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt.toISOString(),
    scope: row.sessionId ? 'session' : 'formation',
    state,
  };
}

export async function updateInstructorAnnouncement(
  trainerUserId: string,
  announcementId: string,
  input: Partial<CreateInstructorAnnouncementInput>,
): Promise<InstructorAnnouncementRow | null> {
  const existing = await prisma.portalSessionAnnouncement.findUnique({
    where: { id: announcementId },
    select: {
      id: true,
      formationId: true,
      sessionId: true,
      isPublished: true,
      publishedAt: true,
    },
  });

  if (!existing) return null;

  const access = await assertInstructorCanManageAnnouncement(
    trainerUserId,
    existing.formationId,
    existing.sessionId,
  );
  if (!access.ok) throw new Error(access.message);

  const wasLive =
    existing.isPublished && existing.publishedAt <= new Date();

  const publishedAt =
    input.publishedAt != null ? new Date(input.publishedAt) : undefined;

  const row = await prisma.portalSessionAnnouncement.update({
    where: { id: announcementId },
    data: {
      ...(input.title != null ? { title: input.title.trim() } : {}),
      ...(input.content != null ? { content: input.content.trim() } : {}),
      ...(input.isPublished != null ? { isPublished: input.isPublished } : {}),
      ...(publishedAt != null ? { publishedAt } : {}),
      ...(input.sessionId !== undefined
        ? { sessionId: input.sessionId?.trim() || null }
        : {}),
    },
    select: {
      id: true,
      formationId: true,
      sessionId: true,
      title: true,
      content: true,
      isPublished: true,
      publishedAt: true,
      formation: { select: { name: true } },
      session: { select: { dateDisplayLabel: true } },
    },
  });

  const now = new Date();
  const state = announcementState(row.isPublished, row.publishedAt, now);

  if (state === 'live' && !wasLive) {
    await notifyTraineesForAnnouncement({
      formationId: row.formationId,
      sessionId: row.sessionId,
      trainerUserId,
      title: row.title,
      content: row.content,
      announcementId: row.id,
    });
  }

  return {
    id: row.id,
    formationId: row.formationId,
    formationName: row.formation.name,
    sessionId: row.sessionId,
    sessionLabel: row.session?.dateDisplayLabel ?? null,
    title: row.title,
    content: row.content,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt.toISOString(),
    scope: row.sessionId ? 'session' : 'formation',
    state,
  };
}

export async function deleteInstructorAnnouncement(
  trainerUserId: string,
  announcementId: string,
): Promise<boolean> {
  const existing = await prisma.portalSessionAnnouncement.findUnique({
    where: { id: announcementId },
    select: { formationId: true, sessionId: true },
  });
  if (!existing) return false;

  const access = await assertInstructorCanManageAnnouncement(
    trainerUserId,
    existing.formationId,
    existing.sessionId,
  );
  if (!access.ok) throw new Error(access.message);

  await prisma.portalSessionAnnouncement.delete({ where: { id: announcementId } });
  return true;
}
