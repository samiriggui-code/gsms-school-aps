import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import { buildCohortActivity } from '@/lib/instructor/instructor-trainees-data';

export async function GET(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim();
  if (!sessionId) return fail('sessionId est requis.', 400);

  try {
    const data = await buildCohortActivity(auth.ctx.userId, sessionId);
    if (!data) return fail('Session introuvable.', 404);
    return ok(data);
  } catch (e) {
    return fail('Impossible de charger l’activité cohorte.', 500, e);
  }
}
