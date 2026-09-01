import Link from 'next/link';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { LmsDiscussionModerationActions } from './lms-discussion-actions';

/** LMS-02 — modération discussions communauté cours. */
export default async function LmsDiscussionsPage() {
  const [discussions, courses] = await Promise.all([
    prisma.discussion.findMany({
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
      include: {
        author: { select: { name: true, email: true } },
        community: {
          select: {
            name: true,
            course: { select: { id: true, title: true } },
          },
        },
        _count: { select: { comments: true } },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
      take: 100,
    }),
  ]);

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Discussions LMS</ToolbarTitle>
          <ToolbarDescription>
            LMS-02 — modération staff (épingler, verrouiller, supprimer). Les apprenants créent côté
            portail.
          </ToolbarDescription>
        </ToolbarHeading>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/vie-scolaire/devoirs">Devoirs</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/vie-scolaire/cours">Cours LMS</Link>
          </Button>
        </div>
      </Toolbar>

      <p className="text-muted-foreground mb-4 text-xs">
        {courses.length} cours · {discussions.length} discussions listées
      </p>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Discussion</th>
              <th className="p-2 font-medium">Cours</th>
              <th className="p-2 font-medium">Auteur</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium">Modération</th>
            </tr>
          </thead>
          <tbody>
            {discussions.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="p-2">
                  <div className="font-medium">{d.title}</div>
                  <div className="text-muted-foreground text-xs">{d._count.comments} commentaires</div>
                </td>
                <td className="p-2 text-xs">{d.community.course?.title ?? d.community.name}</td>
                <td className="p-2 text-xs">{d.author.name ?? d.author.email}</td>
                <td className="p-2 text-xs">
                  {d.isPinned ? 'épinglé · ' : ''}
                  {d.isLocked ? 'verrouillé' : 'ouvert'}
                </td>
                <td className="p-2">
                  <LmsDiscussionModerationActions
                    discussionId={d.id}
                    isPinned={d.isPinned}
                    isLocked={d.isLocked}
                  />
                </td>
              </tr>
            ))}
            {discussions.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={5}>
                  Aucune discussion en base.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
