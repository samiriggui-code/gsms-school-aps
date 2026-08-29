import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

/** G12 — registre CRM LmsCourse (Prisma Course). */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const courses = await prisma.course.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { chapters: true, enrollments: true } },
      },
    });

    const [total, published] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
    ]);

    return ok({
      total,
      published,
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        isPublished: c.isPublished,
        chapterCount: c._count.chapters,
        enrollmentCount: c._count.enrollments,
        createdByName: c.createdBy.name ?? c.createdBy.email,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[cours] GET', e);
    return fail('Failed to list LMS courses', 500);
  }
}

/** POST — créer un cours brouillon (DocType LmsCourse). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: { title?: string; description?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const title = body.title?.trim();
  if (!title) return fail('title is required', 400);

  try {
    const course = await prisma.course.create({
      data: {
        title,
        description: body.description?.trim() || null,
        isPublished: false,
        createdById: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        isPublished: true,
        createdAt: true,
      },
    });
    return ok({ course }, 201);
  } catch (e) {
    console.error('[cours] POST', e);
    return fail('Failed to create LMS course', 500);
  }
}
