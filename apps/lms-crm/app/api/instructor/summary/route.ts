import { ok, fail } from '@/app/api/_shared/http/response';
import { buildInstructorDashboard } from '@/lib/instructor/instructor-dashboard-data';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';

/** Résumé sidebar — prochaine session + KPI légers. */
export async function GET() {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const { stats, nextSession } = await buildInstructorDashboard(auth.ctx.userId);
    return ok({
      stats,
      nextSession: nextSession
        ? {
            id: nextSession.id,
            label: nextSession.dateDisplayLabel,
            formationName: nextSession.formation.name,
            participantCount: nextSession.participantCount,
          }
        : null,
    });
  } catch (e) {
    return fail('Impossible de charger le résumé.', 500, e);
  }
}
