import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import { assertInstructorOwnsCourse } from '@/lib/instructor/instructor-courses-data';
import { listQuestionBanksForCourse } from '@/lib/instructor/instructor-question-bank-data';

type Ctx = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await context.params;
  const access = await assertInstructorOwnsCourse(auth.ctx.userId, courseId);
  if (!access.ok) return fail(access.message, access.status);

  try {
    const banks = await listQuestionBanksForCourse(courseId, access.formationId);
    return ok({ banks });
  } catch (e) {
    return fail('Banque de questions indisponible.', 500, e);
  }
}
