import { ok, fail } from '@/app/api/_shared/http/response';
import { buildInstructorDashboard } from '@/lib/instructor/instructor-dashboard-data';
import { normalizeInstructorDashboardPayload } from '@/lib/instructor/instructor-dashboard-normalize';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';

export async function GET() {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const payload = await buildInstructorDashboard(auth.ctx.userId);
    return ok({ ...normalizeInstructorDashboardPayload(payload), user: auth.ctx.user });
  } catch (e) {
    return fail('Impossible de charger le tableau de bord formateur.', 500, e);
  }
}
