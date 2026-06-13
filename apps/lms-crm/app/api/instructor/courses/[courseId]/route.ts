import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import {
  assertInstructorOwnsCourse,
  getInstructorCourseBuilder,
  updateInstructorActivity,
  updateInstructorChapter,
  upsertChapterMuxData,
} from '@/lib/instructor/instructor-courses-data';
import { isLmsContentReviewRequired } from '@/lib/portal/lms-content-review';

type Ctx = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await context.params;
  const access = await assertInstructorOwnsCourse(auth.ctx.userId, courseId);
  if (!access.ok) return fail(access.message, access.status);

  try {
    const course = await getInstructorCourseBuilder(courseId);
    if (!course) return fail('Parcours introuvable.', 404);
    return ok({
      course,
      formationName: access.formationName,
      formationId: access.formationId,
      contentReviewRequired: isLmsContentReviewRequired(),
    });
  } catch (e) {
    return fail('Impossible de charger le parcours.', 500, e);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { courseId } = await context.params;
  const access = await assertInstructorOwnsCourse(auth.ctx.userId, courseId);
  if (!access.ok) return fail(access.message, access.status);

  let body: {
    target?: 'chapter' | 'activity' | 'mux';
    chapterId?: string;
    activityId?: string;
    title?: string;
    name?: string;
    isPublished?: boolean;
    wantsPublished?: boolean;
    isFree?: boolean;
    content?: unknown;
    details?: unknown;
    muxAssetId?: string;
    muxPlaybackId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  try {
    if (body.target === 'chapter' && body.chapterId) {
      await updateInstructorChapter(body.chapterId, {
        title: body.title,
        isPublished: body.isPublished,
        wantsPublished: body.wantsPublished,
        isFree: body.isFree,
      });
    } else if (body.target === 'mux' && body.chapterId && body.muxAssetId) {
      await upsertChapterMuxData(body.chapterId, body.muxAssetId, body.muxPlaybackId ?? null);
    } else if (body.target === 'activity' && body.activityId) {
      await updateInstructorActivity(body.activityId, auth.ctx.userId, {
        name: body.name,
        isPublished: body.isPublished,
        wantsPublished: body.wantsPublished,
        content: body.content,
        details: body.details,
      });
    } else {
      return fail('target/chapterId/activityId invalides.', 400);
    }

    const course = await getInstructorCourseBuilder(courseId);
    return ok({ course });
  } catch (e) {
    return fail('Enregistrement impossible.', 500, e);
  }
}
