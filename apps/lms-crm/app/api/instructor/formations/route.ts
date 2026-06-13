import { ok, fail } from '@/app/api/_shared/http/response';
import { listInstructorFormations } from '@/lib/instructor/instructor-assignments-data';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';

export async function GET() {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const items = await listInstructorFormations(auth.ctx.userId);
    return ok({ items, total: items.length });
  } catch (e) {
    return fail('Impossible de charger les formations.', 500, e);
  }
}
