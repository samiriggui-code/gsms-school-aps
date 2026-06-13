import { prisma } from '@/lib/prisma';

export type PortalAnnouncementRow = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  scope: 'formation' | 'session';
  sessionLabel: string | null;
};

export async function listPortalAnnouncementsForLearner(input: {
  formationId: string | null | undefined;
  sessionIds: string[];
  limit?: number;
}): Promise<PortalAnnouncementRow[]> {
  const { formationId, sessionIds, limit = 50 } = input;
  if (!formationId) return [];

  const rows = await prisma.portalSessionAnnouncement.findMany({
    where: {
      formationId,
      isPublished: true,
      publishedAt: { lte: new Date() },
      OR: [{ sessionId: null }, ...(sessionIds.length ? [{ sessionId: { in: sessionIds } }] : [])],
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      publishedAt: true,
      sessionId: true,
      session: { select: { dateDisplayLabel: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    publishedAt: r.publishedAt.toISOString(),
    scope: r.sessionId ? ('session' as const) : ('formation' as const),
    sessionLabel: r.session?.dateDisplayLabel ?? null,
  }));
}

export async function resolveLearnerSessionIds(userId: string, interestedSessionId: string | null) {
  const ids = new Set<string>();
  if (interestedSessionId) ids.add(interestedSessionId);

  const enrolled = await prisma.formationSessionParticipant.findMany({
    where: { userId },
    select: { sessionId: true },
  });
  for (const row of enrolled) ids.add(row.sessionId);

  return Array.from(ids);
}
