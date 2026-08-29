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
import { CreateLmsCourseForm } from './create-lms-course-form';
import { LmsCoursePublishButton } from './lms-course-publish-button';

/** G12 — registre CRM des cours LMS (DocType LmsCourse → Prisma Course). */
export default async function LmsCoursPage() {
  const courses = await prisma.course.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      isPublished: true,
      updatedAt: true,
      createdBy: { select: { name: true, email: true } },
      _count: { select: { chapters: true, enrollments: true } },
    },
  });

  const [total, published] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true } }),
  ]);

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Cours LMS</ToolbarTitle>
          <ToolbarDescription>
            G12 — registre CRM LmsCourse (Prisma Course). Contenu édité côté formateur ; cette page
            gère le catalogue staff (création, publication). Alias DocType : course — pas
            d&apos;alias enrollment nu.
          </ToolbarDescription>
        </ToolbarHeading>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique/suivi-formations/tableau">Revue e-formation</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-academique">Retour académique</Link>
          </Button>
        </div>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{total}</div>
          <div className="text-muted-foreground text-sm">Cours en base</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{published}</div>
          <div className="text-muted-foreground text-sm">Publiés</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{total - published}</div>
          <div className="text-muted-foreground text-sm">Brouillons</div>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Nouveau cours</h2>
      <CreateLmsCourseForm />

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Registre</h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Titre</th>
              <th className="p-2 font-medium">Chapitres</th>
              <th className="p-2 font-medium">Inscriptions LMS</th>
              <th className="p-2 font-medium">Auteur</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium">Maj</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-2">
                  <div className="font-medium">{c.title}</div>
                  {c.description ? (
                    <div className="text-muted-foreground line-clamp-1 text-xs">{c.description}</div>
                  ) : null}
                  <div className="text-muted-foreground font-mono text-[10px]">{c.id}</div>
                </td>
                <td className="p-2">{c._count.chapters}</td>
                <td className="p-2">{c._count.enrollments}</td>
                <td className="p-2 text-xs">{c.createdBy.name ?? c.createdBy.email}</td>
                <td className="p-2 text-xs">{c.isPublished ? 'publié' : 'brouillon'}</td>
                <td className="p-2 text-xs">{c.updatedAt.toISOString().slice(0, 10)}</td>
                <td className="p-2">
                  <LmsCoursePublishButton courseId={c.id} isPublished={c.isPublished} />
                </td>
              </tr>
            ))}
            {courses.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={7}>
                  Aucun cours — créer un brouillon ci-dessus, ou via l&apos;espace formateur.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        API :{' '}
        <code className="font-mono">
          GET|POST /api/sections/gestion-academique/vie-scolaire/cours
        </code>
      </p>
    </Container>
  );
}
