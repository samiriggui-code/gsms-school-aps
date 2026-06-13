import { ok, fail } from '@/app/api/_shared/http/response';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { prisma } from '@/lib/prisma';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export async function GET() {
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { userId, candidature } = auth.ctx;
  const courseId = candidature?.formation?.courseId ?? null;

  let chapterIds: string[] = [];
  if (courseId) {
    const chapters = await prisma.chapter.findMany({
      where: { courseId, isPublished: true },
      select: { id: true },
    });
    chapterIds = chapters.map((c) => c.id);
  }

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - 29);

  const [progressRows, quizRows] = await Promise.all([
    chapterIds.length
      ? prisma.userProgress.findMany({
          where: {
            userId,
            isCompleted: true,
            updatedAt: { gte: since },
            chapterId: { in: chapterIds },
          },
          select: { updatedAt: true },
        })
      : Promise.resolve([]),
    prisma.quizAttempt.findMany({
      where: {
        userId,
        passed: true,
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    }),
  ]);

  const lessonsByDay = new Map<string, number>();
  for (const row of progressRows) {
    const key = dayKey(row.updatedAt);
    lessonsByDay.set(key, (lessonsByDay.get(key) ?? 0) + 1);
  }

  const quizzesByDay = new Map<string, number>();
  for (const row of quizRows) {
    const key = dayKey(row.createdAt);
    quizzesByDay.set(key, (quizzesByDay.get(key) ?? 0) + 1);
  }

  const series: Array<{
    date: string;
    label: string;
    lessons: number;
    quizzes: number;
  }> = [];

  for (let offset = 29; offset >= 0; offset -= 1) {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - offset);
    const key = dayKey(d);
    series.push({
      date: key,
      label: formatDayLabel(d),
      lessons: lessonsByDay.get(key) ?? 0,
      quizzes: quizzesByDay.get(key) ?? 0,
    });
  }

  const totals = series.reduce(
    (acc, point) => ({
      lessons: acc.lessons + point.lessons,
      quizzes: acc.quizzes + point.quizzes,
    }),
    { lessons: 0, quizzes: 0 },
  );

  return ok({
    days: 30,
    series,
    totals,
  });
}
