import { ok, fail } from '@/app/api/_shared/http/response';

import { canAccessChapter, chapterLockReason } from '@/lib/portal/lms-access';

import { serializePortalActivity } from '@/lib/portal/lms-quiz';

import { isMuxPlaybackConfigured } from '@/lib/portal/mux-playback';

import { getPortalLearnerContext } from '@/lib/portal/portal-auth';

import { prisma } from '@/lib/prisma';



type Ctx = { params: Promise<{ courseId: string; chapterId: string }> };



async function latestQuizAttempts(userId: string, activityIds: string[]) {

  if (activityIds.length === 0) return [];

  const rows = await prisma.quizAttempt.findMany({

    where: { userId, activityId: { in: activityIds } },

    orderBy: { createdAt: 'desc' },

    select: { activityId: true, score: true, passed: true, createdAt: true },

  });

  const latest = new Map<string, (typeof rows)[number]>();

  for (const row of rows) {

    if (!latest.has(row.activityId)) latest.set(row.activityId, row);

  }

  return Array.from(latest.values());

}



export async function GET(_request: Request, { params }: Ctx) {

  const auth = await getPortalLearnerContext();

  if (!auth.ok) return fail(auth.message, auth.status);



  const { courseId, chapterId } = await params;

  const { userId, access, sessionStartsAt, candidature } = auth.ctx;

  const primaryCourseId = candidature?.formation?.courseId ?? null;



  if (primaryCourseId && courseId !== primaryCourseId) {

    return fail('Formation non accessible.', 403);

  }



  const chapter = await prisma.chapter.findFirst({

    where: {

      id: chapterId,

      courseId,

      isPublished: true,

      course: { isPublished: true },

    },

    select: {

      id: true,

      title: true,

      description: true,

      position: true,

      isFree: true,

      isPublished: true,

      muxData: { select: { playbackId: true } },

      course: {

        select: {

          id: true,

          title: true,

          chapters: {

            where: { isPublished: true },

            orderBy: { position: 'asc' },

            select: { id: true, title: true, position: true, isFree: true, isPublished: true },

          },

        },

      },

      activities: {

        where: { isPublished: true },

        orderBy: { position: 'asc' },

        select: {

          id: true,

          name: true,

          type: true,

          subType: true,

          position: true,

          content: true,

          details: true,

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

      },

    },

  });



  if (!chapter) return fail('Leçon introuvable.', 404);



  const lockReason = chapterLockReason(access, chapter);

  if (lockReason) return fail(lockReason, 403);



  const quizActivityIds = chapter.activities

    .filter((a) => a.subType === 'QUIZ_MULTIPLE_CHOICE')

    .map((a) => a.id);

  const assignmentIds = chapter.activities

    .filter((a) => a.type === 'ASSIGNMENT' && a.assignment)

    .map((a) => a.assignment!.id);



  const [progress, completedIds, quizAttempts, assignmentSubmissions] = await Promise.all([

    prisma.userProgress.findUnique({

      where: { userId_chapterId: { userId, chapterId } },

      select: { isCompleted: true },

    }),

    prisma.userProgress.findMany({

      where: {

        userId,

        chapterId: { in: chapter.course.chapters.map((c) => c.id) },

        isCompleted: true,

      },

      select: { chapterId: true },

    }),

    latestQuizAttempts(userId, quizActivityIds),

    assignmentIds.length
      ? prisma.assignmentSubmission.findMany({
          where: { userId, assignmentId: { in: assignmentIds } },
          select: {
            assignmentId: true,
            content: true,
            fileUrl: true,
            grade: true,
            feedback: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),

  ]);



  const attemptByActivity = new Map(quizAttempts.map((a) => [a.activityId, a]));
  const submissionByAssignment = new Map(
    assignmentSubmissions.map((s) => [s.assignmentId, s]),
  );

  const done = new Set(completedIds.map((p) => p.chapterId));



  const syllabus = chapter.course.chapters.map((ch) => ({

    id: ch.id,

    title: ch.title,

    position: ch.position,

    isFree: ch.isFree,

    accessible: canAccessChapter(access, ch),

    completed: done.has(ch.id),

    current: ch.id === chapterId,

    lockReason: chapterLockReason(access, ch),

  }));



  const prev = syllabus.filter((s) => s.position < chapter.position && s.accessible).at(-1);

  const next = syllabus.find((s) => s.position > chapter.position && s.accessible);



  const activities = chapter.activities.map((a) =>
    serializePortalActivity(
      a,
      a.subType === 'QUIZ_MULTIPLE_CHOICE' ? attemptByActivity.get(a.id) ?? null : null,
      a.assignment ? submissionByAssignment.get(a.assignment.id) ?? null : null,
    ),
  );



  return ok({

    tier: access.tier,

    sessionStartsAt: sessionStartsAt?.toISOString() ?? null,

    video: {

      muxConfigured: isMuxPlaybackConfigured(),

      hasMuxPlayback: Boolean(chapter.muxData?.playbackId),

    },

    course: { id: chapter.course.id, title: chapter.course.title },

    chapter: {

      id: chapter.id,

      title: chapter.title,

      description: chapter.description,

      position: chapter.position,

      isFree: chapter.isFree,

      completed: progress?.isCompleted ?? false,

      activities,

    },

    syllabus,

    navigation: {

      prevChapterId: prev?.id ?? null,

      nextChapterId: next?.id ?? null,

    },

  });

}


