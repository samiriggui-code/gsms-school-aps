import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import { listInstructorTrainees } from '@/lib/instructor/instructor-trainees-data';

export async function GET(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim() || null;

  try {
    const items = await listInstructorTrainees(auth.ctx.userId, sessionId);
    return ok({ items, total: items.length, sessionId });
  } catch (e) {
    return fail('Impossible de charger les stagiaires.', 500, e);
  }
}
