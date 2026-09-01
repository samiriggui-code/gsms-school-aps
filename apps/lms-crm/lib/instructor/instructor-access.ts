import { hasPermission } from '@repo/doctype';
import { formationSessionMeta } from '@/lib/doctype/formation-session-meta';
import { principalFromUserId } from '@/lib/doctype/principal-from-user';
import { prisma } from '@/lib/prisma';

export async function listInstructorSessionIds(trainerUserId: string): Promise<string[]> {
  const rows = await prisma.formationSession.findMany({
    where: { trainerUserId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function assertInstructorOwnsSession(
  trainerUserId: string,
  sessionId: string,
): Promise<
  | {
      ok: true;
      session: {
        id: string;
        dateDisplayLabel: string;
        location: string;
        startDate: Date | null;
        endDate: Date | null;
        formation: {
          id: string;
          name: string;
          slug: string;
          courseId: string | null;
        };
      };
    }
  | { ok: false; message: string; status: number }
> {
  const session = await prisma.formationSession.findFirst({
    where: { id: sessionId, trainerUserId },
    select: {
      id: true,
      dateDisplayLabel: true,
      location: true,
      startDate: true,
      endDate: true,
      formation: {
        select: { id: true, name: true, slug: true, courseId: true },
      },
    },
  });

  if (!session) {
    return { ok: false, message: 'Session introuvable ou non assignée.', status: 404 };
  }

  const principal = await principalFromUserId(trainerUserId);
  if (
    !principal ||
    !hasPermission({
      meta: formationSessionMeta,
      principal,
      action: 'read',
      document: session as Record<string, unknown>,
    })
  ) {
    return { ok: false, message: 'Session introuvable ou non assignée.', status: 404 };
  }

  return { ok: true, session };
}

export async function assertInstructorOwnsParticipant(
  trainerUserId: string,
  sessionId: string,
  userId: string,
): Promise<
  | { ok: true }
  | { ok: false; message: string; status: number }
> {
  const access = await assertInstructorOwnsSession(trainerUserId, sessionId);
  if (!access.ok) return access;

  const participant = await prisma.formationSessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
    select: { id: true },
  });

  if (!participant) {
    return { ok: false, message: 'Stagiaire non inscrit à cette session.', status: 404 };
  }

  return { ok: true };
}
