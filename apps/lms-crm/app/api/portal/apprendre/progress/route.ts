import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter } from '@/lib/portal/lms-access';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  let body: { chapterId?: string; completed?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const chapterId = body.chapterId?.trim();
  if (!chapterId) return fail('chapterId requis.', 400);

  const { userId, access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, isPublished: true },
    select: { id: true, courseId: true, isFree: true, isPublished: true },
  });
  if (!chapter) return fail('Leçon introuvable.', 404);

  if (primaryCourseId && chapter.courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  if (!canAccessChapter(access, chapter)) {
    return fail('Contenu verrouillé.', 403);
  }

  const completed = body.completed !== false;

  const row = await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, isCompleted: completed },
    update: { isCompleted: completed },
    select: { chapterId: true, isCompleted: true },
  });

  return ok(row);
}
