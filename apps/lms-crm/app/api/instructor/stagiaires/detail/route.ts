import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import { getInstructorTraineeDetail } from '@/lib/instructor/instructor-trainees-data';

export async function GET(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim();
  const userId = request.nextUrl.searchParams.get('userId')?.trim();

  if (!sessionId || !userId) {
    return fail('sessionId et userId sont requis.', 400);
  }

  try {
    const detail = await getInstructorTraineeDetail(auth.ctx.userId, sessionId, userId);
    if (!detail) return fail('Stagiaire introuvable.', 404);
    return ok(detail);
  } catch (e) {
    return fail('Impossible de charger le détail stagiaire.', 500, e);
  }
}
