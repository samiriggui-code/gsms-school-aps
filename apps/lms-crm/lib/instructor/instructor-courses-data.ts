import { prisma } from '@/lib/prisma';
import { listInstructorFormations } from '@/lib/instructor/instructor-assignments-data';
import { resolveInstructorPublishState } from '@/lib/lms/admin-content-review-data';
import type { LmsContentReviewStatus } from '@repo/database';

export type InstructorCourseListRow = {
  id: string;
  title: string;
  isPublished: boolean;
  formationId: string;
  formationName: string;
  chapterCount: number;
  activityCount: number;
};

export type InstructorBuilderActivity = {
  id: string;
  name: string;
  type: string;
  subType: string;
  position: number;
  isPublished: boolean;
  reviewStatus: LmsContentReviewStatus;
  reviewNote: string | null;
  content: unknown;
  details: unknown;
  updatedAt: string;
};

export type InstructorBuilderChapter = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  videoUrl: string | null;
  reviewStatus: LmsContentReviewStatus;
  reviewNote: string | null;
  muxPlaybackId: string | null;
  muxAssetId: string | null;
  activityCount: number;
  activities: InstructorBuilderActivity[];
};

export type InstructorCourseBuilder = {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  formationId: string | null;
  formationName: string | null;
  chapters: InstructorBuilderChapter[];
};

export async function assertInstructorOwnsCourse(
  trainerUserId: string,
  courseId: string,
): Promise<
  | { ok: true; formationId: string; formationName: string }
  | { ok: false; message: string; status: number }
> {
  const formation = await prisma.formation.findFirst({
    where: {
      courseId,
      sessions: { some: { trainerUserId } },
    },
    select: { id: true, name: true },
  });

  if (!formation) {
    return { ok: false, message: 'Parcours non assigné ou introuvable.', status: 404 };
  }

  return { ok: true, formationId: formation.id, formationName: formation.name };
}

export async function listInstructorCourses(trainerUserId: string): Promise<InstructorCourseListRow[]> {
  const formations = await listInstructorFormations(trainerUserId);
  const courseIds = Array.from(new Set(formations.map((f) => f.courseId).filter(Boolean))) as string[];
  if (courseIds.length === 0) return [];

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      title: true,
      isPublished: true,
      formationCatalog: { select: { id: true, name: true } },
      chapters: {
        select: {
          id: true,
          _count: { select: { activities: true } },
        },
      },
    },
  });

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    isPublished: c.isPublished,
    formationId: c.formationCatalog?.id ?? formations.find((f) => f.courseId === c.id)?.id ?? '',
    formationName: c.formationCatalog?.name ?? c.title,
    chapterCount: c.chapters.length,
    activityCount: c.chapters.reduce((sum, ch) => sum + ch._count.activities, 0),
  }));
}

export async function getInstructorCourseBuilder(courseId: string): Promise<InstructorCourseBuilder | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      isPublished: true,
      formationCatalog: { select: { id: true, name: true } },
      chapters: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
          isPublished: true,
          isFree: true,
          videoUrl: true,
          reviewStatus: true,
          reviewNote: true,
          muxData: { select: { assetId: true, playbackId: true } },
          activities: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              type: true,
              subType: true,
              position: true,
              isPublished: true,
              reviewStatus: true,
              reviewNote: true,
              content: true,
              details: true,
              updatedAt: true,
            },
          },
          _count: { select: { activities: true } },
        },
      },
    },
  });

  if (!course) return null;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    isPublished: course.isPublished,
    formationId: course.formationCatalog?.id ?? null,
    formationName: course.formationCatalog?.name ?? null,
    chapters: course.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
      isPublished: ch.isPublished,
      isFree: ch.isFree,
      videoUrl: ch.videoUrl,
      reviewStatus: ch.reviewStatus,
      reviewNote: ch.reviewNote,
      muxPlaybackId: ch.muxData?.playbackId ?? null,
      muxAssetId: ch.muxData?.assetId ?? null,
      activityCount: ch._count.activities,
      activities: ch.activities.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        subType: a.subType,
        position: a.position,
        isPublished: a.isPublished,
        reviewStatus: a.reviewStatus,
        reviewNote: a.reviewNote,
        content: a.content,
        details: a.details,
        updatedAt: a.updatedAt.toISOString(),
      })),
    })),
  };
}

export async function reorderInstructorChapters(courseId: string, orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.chapter.update({
        where: { id, courseId },
        data: { position: index + 1 },
      }),
    ),
  );
}

export async function reorderInstructorActivities(chapterId: string, orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.activity.update({
        where: { id, chapterId },
        data: { position: index + 1 },
      }),
    ),
  );
}

export async function updateInstructorChapter(
  chapterId: string,
  data: Partial<{
    title: string;
    description: string | null;
    isPublished: boolean;
    isFree: boolean;
    wantsPublished?: boolean;
  }>,
) {
  const publishPatch =
    data.wantsPublished != null ? resolveInstructorPublishState(data.wantsPublished) : null;

  return prisma.chapter.update({
    where: { id: chapterId },
    data: {
      ...(data.title != null ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isFree != null ? { isFree: data.isFree } : {}),
      ...(publishPatch
        ? {
            isPublished: publishPatch.isPublished,
            reviewStatus: publishPatch.reviewStatus,
            submittedForReviewAt: publishPatch.submittedForReviewAt,
          }
        : data.isPublished != null
          ? { isPublished: data.isPublished }
          : {}),
    },
  });
}

export async function upsertChapterMuxData(
  chapterId: string,
  assetId: string,
  playbackId: string | null,
) {
  const trimmedAsset = assetId.trim();
  if (!trimmedAsset) throw new Error('assetId requis');

  return prisma.muxData.upsert({
    where: { chapterId },
    create: {
      chapterId,
      assetId: trimmedAsset,
      playbackId: playbackId?.trim() || null,
    },
    update: {
      assetId: trimmedAsset,
      playbackId: playbackId?.trim() || null,
    },
  });
}

export async function updateInstructorActivity(
  activityId: string,
  userId: string,
  data: Partial<{
    name: string;
    isPublished: boolean;
    wantsPublished?: boolean;
    content: unknown;
    details: unknown;
  }>,
) {
  const publishPatch =
    data.wantsPublished != null ? resolveInstructorPublishState(data.wantsPublished) : null;

  return prisma.activity.update({
    where: { id: activityId },
    data: {
      ...(data.name != null ? { name: data.name.trim() } : {}),
      ...(publishPatch
        ? {
            isPublished: publishPatch.isPublished,
            reviewStatus: publishPatch.reviewStatus,
            submittedForReviewAt: publishPatch.submittedForReviewAt,
          }
        : data.isPublished != null
          ? { isPublished: data.isPublished }
          : {}),
      ...(data.content !== undefined ? { content: data.content as object } : {}),
      ...(data.details !== undefined ? { details: data.details as object } : {}),
      lastModifiedById: userId,
    },
  });
}

export async function getChapterForPreview(chapterId: string, courseId: string) {
  return prisma.chapter.findFirst({
    where: { id: chapterId, courseId },
    select: {
      id: true,
      title: true,
      muxData: { select: { playbackId: true } },
      activities: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          name: true,
          subType: true,
          position: true,
          isPublished: true,
          reviewStatus: true,
          content: true,
          details: true,
        },
      },
    },
  });
}
