import Link from 'next/link';
import { EnrollmentStatus } from '@repo/database';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { LmsEnrollmentStatusActions } from './lms-enrollment-status-actions';

/** G12 — admin inscriptions LMS (Enrollment / LmsEnrollment). */
export default async function InscriptionsLmsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const courseId = sp.courseId?.trim() || undefined;
  const statusFilter =
    sp.status && Object.values(EnrollmentStatus).includes(sp.status as EnrollmentStatus)
      ? (sp.status as EnrollmentStatus)
      : undefined;

  const [enrollments, courses, byStatus, totalAll] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        user: { select: { name: true, email: true, firstName: true, lastName: true } },
        course: {
          select: {
            id: true,
            title: true,
            _count: { select: { chapters: true } },
          },
        },
        session: { select: { title: true } },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true, _count: { select: { enrollments: true } } },
      take: 200,
    }),
    prisma.enrollment.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.enrollment.count(),
  ]);

  const chapterIdsByCourse = new Map<string, string[]>();
  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
  const chapters =
    courseIds.length === 0
      ? []
      : await prisma.chapter.findMany({
          where: { courseId: { in: courseIds } },
          select: { id: true, courseId: true },
        });
  for (const ch of chapters) {
    const list = chapterIdsByCourse.get(ch.courseId) ?? [];
    list.push(ch.id);
    chapterIdsByCourse.set(ch.courseId, list);
  }

  const progressByKey = new Map<string, number>();
  if (chapters.length > 0 && enrollments.length > 0) {
    const completed = await prisma.userProgress.findMany({
      where: {
        userId: { in: enrollments.map((e) => e.userId) },
        chapterId: { in: chapters.map((c) => c.id) },
        isCompleted: true,
      },
      select: { userId: true, chapterId: true },
    });
    const chapterToCourse = new Map(chapters.map((c) => [c.id, c.courseId]));
    for (const row of completed) {
      const cId = chapterToCourse.get(row.chapterId);
      if (!cId) continue;
      const key = `${row.userId}:${cId}`;
      progressByKey.set(key, (progressByKey.get(key) ?? 0) + 1);
    }
  }

  const statusCounts = Object.fromEntries(
    byStatus.map((s) => [s.status, s._count._all]),
  ) as Partial<Record<EnrollmentStatus, number>>;

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Inscriptions LMS</ToolbarTitle>
          <ToolbarDescription>
            G12 — admin Enrollment (DocType LmsEnrollment). Progression = chapitres complétés /
            total du cours. Pas d&apos;alias enrollment nu.
          </ToolbarDescription>
        </ToolbarHeading>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/vie-scolaire/cours">Cours LMS</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique">Retour académique</Link>
          </Button>
        </div>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{totalAll}</div>
          <div className="text-muted-foreground text-sm">Total inscriptions</div>
        </div>
        {(
          [
            EnrollmentStatus.PENDING,
            EnrollmentStatus.VALIDATED,
            EnrollmentStatus.COMPLETED,
          ] as const
        ).map((st) => (
          <div key={st} className="rounded-md border p-3">
            <div className="text-2xl font-semibold">{statusCounts[st] ?? 0}</div>
            <div className="text-muted-foreground text-sm">{st}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/gestion-academique/vie-scolaire/inscriptions-lms"
          className={!courseId && !statusFilter ? 'font-semibold underline' : 'underline'}
        >
          Tous
        </Link>
        {(Object.values(EnrollmentStatus) as EnrollmentStatus[]).map((st) => (
          <Link
            key={st}
            href={`/gestion-academique/vie-scolaire/inscriptions-lms?status=${st}${courseId ? `&courseId=${courseId}` : ''}`}
            className={statusFilter === st ? 'font-semibold underline' : 'underline'}
          >
            {st} ({statusCounts[st] ?? 0})
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {courses
          .filter((c) => c._count.enrollments > 0)
          .slice(0, 30)
          .map((c) => (
            <Link
              key={c.id}
              href={`/gestion-academique/vie-scolaire/inscriptions-lms?courseId=${c.id}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className={
                courseId === c.id
                  ? 'bg-muted rounded border px-2 py-1 font-semibold'
                  : 'rounded border px-2 py-1'
              }
            >
              {c.title} ({c._count.enrollments})
            </Link>
          ))}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Apprenant</th>
              <th className="p-2 font-medium">Cours</th>
              <th className="p-2 font-medium">Session</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium">Progression</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const chapterTotal = e.course._count.chapters;
              const done = progressByKey.get(`${e.userId}:${e.courseId}`) ?? 0;
              const pct =
                chapterTotal > 0 ? Math.round((done / chapterTotal) * 100) : null;
              const label =
                e.user.name ||
                [e.user.firstName, e.user.lastName].filter(Boolean).join(' ') ||
                e.user.email;
              return (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="p-2">
                    <div className="font-medium">{label}</div>
                    <div className="text-muted-foreground text-xs">{e.user.email}</div>
                  </td>
                  <td className="p-2">{e.course.title}</td>
                  <td className="p-2 text-xs">{e.session?.title ?? '—'}</td>
                  <td className="p-2 font-mono text-xs">{e.status}</td>
                  <td className="p-2 text-xs">
                    {pct === null ? '—' : `${done}/${chapterTotal} (${pct} %)`}
                  </td>
                  <td className="p-2">
                    <LmsEnrollmentStatusActions enrollmentId={e.id} status={e.status} />
                  </td>
                </tr>
              );
            })}
            {enrollments.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={6}>
                  Aucune inscription LMS pour ce filtre.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        API :{' '}
        <code className="font-mono">
          GET|PATCH /api/sections/gestion-academique/vie-scolaire/inscriptions-lms
        </code>
      </p>
    </Container>
  );
}
