import {
  FormationExamStatus,
  FormationVitrineSessionKind,
  Prisma,
} from '@repo/database';

type Tx = Prisma.TransactionClient;

export function parseJuryMemberNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

/** Crée ou resynchronise l'examen catalogue pour une session WITH_EXAM. */
export async function ensureFormationExamForSession(tx: Tx, sessionId: string) {
  const session = await tx.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      sessionKind: true,
      examDate: true,
      examVenueRoomId: true,
      formationExam: { select: { id: true } },
    },
  });
  if (!session) throw new Error('SESSION_NOT_FOUND');

  if (session.sessionKind !== FormationVitrineSessionKind.WITH_EXAM) {
    if (session.formationExam) {
      await tx.formationExam.delete({ where: { sessionId } });
    }
    return null;
  }

  const data = {
    scheduledAt: session.examDate,
    venueRoomId: session.examVenueRoomId,
  };

  if (session.formationExam) {
    return tx.formationExam.update({
      where: { sessionId },
      data,
    });
  }

  return tx.formationExam.create({
    data: {
      sessionId,
      ...data,
      status: FormationExamStatus.PLANNED,
    },
  });
}

export async function backfillFormationExamsForWithExamSessions(tx: Tx) {
  const sessions = await tx.formationSession.findMany({
    where: { sessionKind: FormationVitrineSessionKind.WITH_EXAM },
    select: { id: true },
  });
  let created = 0;
  for (const s of sessions) {
    const before = await tx.formationExam.findUnique({
      where: { sessionId: s.id },
      select: { id: true },
    });
    await ensureFormationExamForSession(tx, s.id);
    if (!before) created += 1;
  }
  return { total: sessions.length, created };
}
