import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import {
  assertInstructorOwnsCourse,
  getChapterForPreview,
} from '@/lib/instructor/instructor-courses-data';

type Ctx = { params: Promise<{ courseId: string }> };

/** Aperçu formateur d'une UV (brouillons inclus). ?chapterId= */
export async function GET(request: NextRequest, context: Ctx) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await context.params;
  const chapterId = request.nextUrl.searchParams.get('chapterId')?.trim();
  if (!chapterId) return fail('chapterId est requis.', 400);

  const access = await assertInstructorOwnsCourse(auth.ctx.userId, courseId);
  if (!access.ok) return fail(access.message, access.status);

  try {
    const chapter = await getChapterForPreview(chapterId, courseId);
    if (!chapter) return fail('UV introuvable.', 404);
    return ok({ chapter });
  } catch (e) {
    return fail('Aperçu impossible.', 500, e);
  }
}
