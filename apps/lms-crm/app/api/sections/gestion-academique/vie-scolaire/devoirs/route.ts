import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { LMS_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

function canView(session: Session | null | undefined) {
  return !!session && sessionHasPermission(session, LMS_PERMISSION.courseView);
}

function canDraft(session: Session | null | undefined) {
  return !!session && sessionHasPermission(session, LMS_PERMISSION.contentDraft);
}

/** LMS-01 — liste des devoirs (Assignment) côté staff. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!canView(session)) return fail('Forbidden', 403);

  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            chapter: {
              select: {
                id: true,
                title: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
    });

    return ok({
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate?.toISOString() ?? null,
        maxPoints: a.maxPoints,
        submissionCount: a._count.submissions,
        activityId: a.activityId,
        activityName: a.activity.name,
        chapterTitle: a.activity.chapter.title,
        courseId: a.activity.chapter.course.id,
        courseTitle: a.activity.chapter.course.title,
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[devoirs] GET', e);
    return fail('Failed to list assignments', 500);
  }
}

/** POST — créer un devoir sur une activité ASSIGNMENT d'un chapitre. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!canDraft(session)) return fail('Forbidden', 403);

  let body: {
    chapterId?: string;
    title?: string;
    description?: string;
    dueDate?: string;
    maxPoints?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const chapterId = body.chapterId?.trim();
  const title = body.title?.trim();
  if (!chapterId || !title) return fail('chapterId and title are required', 400);

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true },
  });
  if (!chapter) return fail('Chapter not found', 404);

  try {
    const assignment = await prisma.$transaction(async (tx) => {
      const maxPos = await tx.activity.aggregate({
        where: { chapterId },
        _max: { position: true },
      });
      const activity = await tx.activity.create({
        data: {
          name: title,
          type: 'ASSIGNMENT',
          subType: 'DYNAMIC_MARKDOWN',
          chapterId,
          position: (maxPos._max.position ?? 0) + 1,
          content: {},
          lastModifiedById: session.user!.id,
        },
      });

      return tx.assignment.create({
        data: {
          title,
          description: body.description?.trim() || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          maxPoints: body.maxPoints ?? 100,
          activityId: activity.id,
        },
        include: {
          activity: {
            select: {
              chapter: {
                select: { course: { select: { id: true, title: true } } },
              },
            },
          },
        },
      });
    });

    return ok({ assignment: { id: assignment.id, title: assignment.title } }, 201);
  } catch (e) {
    console.error('[devoirs] POST', e);
    return fail('Failed to create assignment', 500);
  }
}
