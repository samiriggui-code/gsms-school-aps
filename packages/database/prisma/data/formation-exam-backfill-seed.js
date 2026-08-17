'use strict';

/**
 * Crée un FormationExam pour chaque session WITH_EXAM sans examen lié.
 * @param {import('@repo/database').Prisma.TransactionClient} tx
 */
async function backfillFormationExamsForWithExamSessions(tx) {
  const sessions = await tx.formationSession.findMany({
    where: { sessionKind: 'WITH_EXAM' },
    select: {
      id: true,
      examDate: true,
      examVenueRoomId: true,
      formationExam: { select: { id: true } },
    },
  });

  let created = 0;
  for (const session of sessions) {
    if (session.formationExam) {
      await tx.formationExam.update({
        where: { sessionId: session.id },
        data: {
          scheduledAt: session.examDate,
          venueRoomId: session.examVenueRoomId,
        },
      });
      continue;
    }
    await tx.formationExam.create({
      data: {
        sessionId: session.id,
        scheduledAt: session.examDate,
        venueRoomId: session.examVenueRoomId,
        status: 'PLANNED',
      },
    });
    created += 1;
  }

  return { total: sessions.length, created };
}

module.exports = { backfillFormationExamsForWithExamSessions };
