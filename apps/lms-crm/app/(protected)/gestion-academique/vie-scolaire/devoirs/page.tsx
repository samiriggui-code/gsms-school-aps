import Link from 'next/link';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@repo/ui/button';
import { prisma } from '@/lib/prisma';
import { CreateLmsAssignmentForm } from './create-lms-assignment-form';
import { LmsAssignmentDetailLink } from './lms-assignment-actions';

/** LMS-01 — admin devoirs (Assignment / LmsAssignment). */
export default async function LmsDevoirsPage() {
  const [assignments, chapters] = await Promise.all([
    prisma.assignment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        activity: {
          select: {
            chapter: {
              select: {
                title: true,
                course: { select: { title: true } },
              },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.chapter.findMany({
      orderBy: [{ course: { title: 'asc' } }, { position: 'asc' }],
      take: 200,
      select: {
        id: true,
        title: true,
        course: { select: { title: true } },
      },
    }),
  ]);

  const chapterOptions = chapters.map((c) => ({
    id: c.id,
    label: `${c.course.title} — ${c.title}`,
  }));

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Devoirs LMS</ToolbarTitle>
          <ToolbarDescription>
            LMS-01 — création staff sur chapitre + suivi des soumissions (DocType LmsAssignment).
          </ToolbarDescription>
        </ToolbarHeading>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/vie-scolaire/discussions">Discussions</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/vie-scolaire/cours">Cours LMS</Link>
          </Button>
        </div>
      </Toolbar>

      <CreateLmsAssignmentForm chapters={chapterOptions} />

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Devoir</th>
              <th className="p-2 font-medium">Cours / chapitre</th>
              <th className="p-2 font-medium">Soumissions</th>
              <th className="p-2 font-medium">Échéance</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="p-2">
                  <div className="font-medium">{a.title}</div>
                  {a.description ? (
                    <div className="text-muted-foreground line-clamp-1 text-xs">{a.description}</div>
                  ) : null}
                </td>
                <td className="p-2 text-xs">
                  {a.activity.chapter.course.title}
                  <br />
                  {a.activity.chapter.title}
                </td>
                <td className="p-2">{a._count.submissions}</td>
                <td className="p-2 text-xs">
                  {a.dueDate ? a.dueDate.toISOString().slice(0, 10) : '—'}
                </td>
                <td className="p-2">
                  <LmsAssignmentDetailLink id={a.id} />
                </td>
              </tr>
            ))}
            {assignments.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={5}>
                  Aucun devoir — en créer un ci-dessus.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
