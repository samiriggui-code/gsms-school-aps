import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import {
  assertInstructorOwnsCourse,
  getInstructorCourseBuilder,
  listInstructorCourses,
  reorderInstructorActivities,
  reorderInstructorChapters,
  updateInstructorActivity,
  updateInstructorChapter,
} from '@/lib/instructor/instructor-courses-data';

export async function GET() {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  try {
    const items = await listInstructorCourses(auth.ctx.userId);
    return ok({ items });
  } catch (e) {
    return fail('Impossible de charger les parcours.', 500, e);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  let body: {
    courseId?: string;
    action?: string;
    orderedChapterIds?: string[];
    chapterId?: string;
    orderedActivityIds?: string[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const courseId = body.courseId?.trim();
  if (!courseId) return fail('courseId est requis.', 400);

  const access = await assertInstructorOwnsCourse(auth.ctx.userId, courseId);
  if (!access.ok) return fail(access.message, access.status);

  try {
    if (body.action === 'reorder-chapters' && body.orderedChapterIds?.length) {
      await reorderInstructorChapters(courseId, body.orderedChapterIds);
      const builder = await getInstructorCourseBuilder(courseId);
      return ok({ course: builder });
    }

    if (body.action === 'reorder-activities' && body.chapterId && body.orderedActivityIds?.length) {
      await reorderInstructorActivities(body.chapterId, body.orderedActivityIds);
      const builder = await getInstructorCourseBuilder(courseId);
      return ok({ course: builder });
    }

    return fail('Action non reconnue.', 400);
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}
