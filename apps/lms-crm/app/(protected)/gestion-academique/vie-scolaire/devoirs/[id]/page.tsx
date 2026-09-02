import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@repo/ui/button';
import { prisma } from '@/lib/prisma';
import { LmsAssignmentGradeForm } from '../lms-assignment-actions';

export default async function LmsDevoirDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      activity: {
        select: {
          chapter: {
            select: { title: true, course: { select: { title: true } } },
          },
        },
      },
      submissions: {
        orderBy: { updatedAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!assignment) notFound();

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>{assignment.title}</ToolbarTitle>
          <ToolbarDescription>
            {assignment.activity.chapter.course.title} — {assignment.activity.chapter.title} · max{' '}
            {assignment.maxPoints} pts
          </ToolbarDescription>
        </ToolbarHeading>
        <Button variant="outline" size="sm" asChild>
          <Link href="/gestion-academique/vie-scolaire/devoirs">Retour devoirs</Link>
        </Button>
      </Toolbar>

      {assignment.description ? (
        <p className="text-muted-foreground mb-4 text-sm whitespace-pre-wrap">{assignment.description}</p>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Apprenant</th>
              <th className="p-2 font-medium">Rendu</th>
              <th className="p-2 font-medium">Notation</th>
            </tr>
          </thead>
          <tbody>
            {assignment.submissions.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-2">{s.user.name ?? s.user.email}</td>
                <td className="p-2 text-xs">
                  {s.content ? (
                    <span className="line-clamp-2">{s.content}</span>
                  ) : s.fileUrl ? (
                    <a href={s.fileUrl} className="text-primary underline" target="_blank" rel="noreferrer">
                      Fichier
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-2">
                  <LmsAssignmentGradeForm
                    assignmentId={assignment.id}
                    submissionId={s.id}
                    maxPoints={assignment.maxPoints}
                    currentGrade={s.grade}
                  />
                </td>
              </tr>
            ))}
            {assignment.submissions.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={3}>
                  Aucune soumission pour l&apos;instant.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
