import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionAcademiqueView } from '../../_lib/require-gestion-academique-auth';

/** KPIs module Suivi formations — enquêtes + circuits n8n. */
export async function GET() {
  const auth = await requireGestionAcademiqueView();
  if (!auth.ok) return auth.response;

  try {
    const [surveysTotal, surveysPending, surveysCompleted, circuitsTotal, circuitsRunning, circuitsFailed] =
      await Promise.all([
        prisma.satisfactionSurvey.count(),
        prisma.satisfactionSurvey.count({ where: { status: { in: ['PENDING', 'SENT'] } } }),
        prisma.satisfactionSurvey.count({ where: { status: 'COMPLETED' } }),
        prisma.sessionAutomationRun.count(),
        prisma.sessionAutomationRun.count({ where: { status: 'RUNNING' } }),
        prisma.sessionAutomationRun.count({ where: { status: 'FAILED' } }),
      ]);

    return ok({
      surveysTotal,
      surveysPending,
      surveysCompleted,
      circuitsTotal,
      circuitsRunning,
      circuitsFailed,
    });
  } catch (e) {
    return fail('Stats Suivi formations indisponibles.', 500, e);
  }
}
