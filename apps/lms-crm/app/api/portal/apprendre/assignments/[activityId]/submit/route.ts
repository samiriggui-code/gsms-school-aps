import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter } from '@/lib/portal/lms-access';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ activityId: string }> };

async function loadAssignmentActivity(activityId: string, userId: string) {
  return prisma.activity.findFirst({
    where: {
      id: activityId,
      type: 'ASSIGNMENT',
      isPublished: true,
      chapter: { isPublished: true, course: { isPublished: true } },
    },
    select: {
      id: true,
      chapterId: true,
      chapter: {
        select: {
          id: true,
          courseId: true,
          isFree: true,
          isPublished: true,
          position: true,
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxPoints: true,
        },
      },
    },
  });
}

/** POST — rendu d'un devoir (texte ou URL fichier). */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { activityId } = await params;
  const { userId, access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  let body: { content?: string; fileUrl?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const content = body.content?.trim() || null;
  const fileUrl = body.fileUrl?.trim() || null;
  if (!content && !fileUrl) return fail('content ou fileUrl requis.', 400);

  const activity = await loadAssignmentActivity(activityId, userId);
  if (!activity?.assignment) return fail('Devoir introuvable.', 404);

  if (primaryCourseId && activity.chapter.courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  if (!canAccessChapter(access, activity.chapter)) {
    return fail('Devoir verrouillé.', 403);
  }

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_userId: {
        assignmentId: activity.assignment.id,
        userId,
      },
    },
    create: {
      assignmentId: activity.assignment.id,
      userId,
      content,
      fileUrl,
    },
    update: { content, fileUrl },
    select: {
      id: true,
      content: true,
      fileUrl: true,
      grade: true,
      feedback: true,
      updatedAt: true,
    },
  });

  return ok({
    submission: {
      ...submission,
      updatedAt: submission.updatedAt.toISOString(),
    },
  });
}

/** GET — ma soumission pour ce devoir. */
export async function GET(_request: Request, { params }: Ctx) {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { activityId } = await params;
  const { userId, access, candidature } = auth.ctx;
  const primaryCourseId = candidature?.formation?.courseId ?? null;

  const activity = await loadAssignmentActivity(activityId, userId);
  if (!activity?.assignment) return fail('Devoir introuvable.', 404);

  if (primaryCourseId && activity.chapter.courseId !== primaryCourseId) {
    return fail('Formation non accessible.', 403);
  }

  if (!canAccessChapter(access, activity.chapter)) {
    return fail('Devoir verrouillé.', 403);
  }

  const submission = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_userId: {
        assignmentId: activity.assignment.id,
        userId,
      },
    },
    select: {
      id: true,
      content: true,
      fileUrl: true,
      grade: true,
      feedback: true,
      updatedAt: true,
    },
  });

  return ok({
    assignment: {
      id: activity.assignment.id,
      title: activity.assignment.title,
      description: activity.assignment.description,
      dueDate: activity.assignment.dueDate?.toISOString() ?? null,
      maxPoints: activity.assignment.maxPoints,
    },
    submission: submission
      ? { ...submission, updatedAt: submission.updatedAt.toISOString() }
      : null,
  });
}
