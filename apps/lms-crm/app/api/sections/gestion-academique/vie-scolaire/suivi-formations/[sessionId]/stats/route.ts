import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  computeProgressForUsers,
  loadSessionCourseBundle,
  resolveSuiviSessionPhase,
} from '@/lib/suivi-formations/session-progress';
import { computeTodaySuiviStats } from '@/lib/suivi-formations/session-days';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { sessionId } = await context.params;

  try {
    const formationSession = await prisma.formationSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        dateDisplayLabel: true,
        startDate: true,
        endDate: true,
        formation: {
          select: { id: true, name: true, courseId: true },
        },
        participants: { select: { userId: true } },
      },
    });

    if (!formationSession) return fail('Session introuvable.', 404);

    const userIds = formationSession.participants.map((p) => p.userId);
    const { bundle } = await loadSessionCourseBundle(sessionId);
    const progressMap = await computeProgressForUsers(userIds, bundle);

    let progressSum = 0;
    let quizCompletionSum = 0;
    let quizCompletionCount = 0;

    for (const uid of userIds) {
      const prog = progressMap.get(uid);
      if (!prog) continue;
      progressSum += prog.progressPercent;
      if (prog.quizTotal > 0) {
        quizCompletionSum += Math.round((prog.quizPassed / prog.quizTotal) * 100);
        quizCompletionCount += 1;
      }
    }

    const participantsTotal = userIds.length;
    const avgProgressPercent =
      participantsTotal > 0 ? Math.round(progressSum / participantsTotal) : 0;
    const avgQuizCompletionPercent =
      quizCompletionCount > 0 ? Math.round(quizCompletionSum / quizCompletionCount) : 0;

    const todayStats = await computeTodaySuiviStats(sessionId);

    return ok({
      sessionId: formationSession.id,
      sessionLabel: formationSession.dateDisplayLabel,
      formationName: formationSession.formation.name,
      phase: resolveSuiviSessionPhase(formationSession.startDate, formationSession.endDate),
      participantsTotal,
      avgProgressPercent,
      presentToday: todayStats.presentToday,
      emargementSlotsCompleted: todayStats.emargementSlotsCompleted,
      emargementSlotsTotal: todayStats.emargementSlotsTotal,
      avgQuizCompletionPercent,
    });
  } catch (error) {
    return fail('Impossible de charger les indicateurs de suivi.', 500, error);
  }
}
