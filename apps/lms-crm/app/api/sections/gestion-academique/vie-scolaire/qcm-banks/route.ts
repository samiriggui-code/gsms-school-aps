import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const formationId = request.nextUrl.searchParams.get('formationId')?.trim() || undefined;

  const rows = await prisma.quizQuestionBank.findMany({
    where: formationId ? { formationId } : {},
    orderBy: { updatedAt: 'desc' },
    include: {
      formation: { select: { id: true, name: true, slug: true } },
      _count: { select: { items: true } },
    },
  });

  return ok({
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      formationId: row.formationId,
      courseId: row.courseId,
      formation: row.formation,
      itemCount: row._count.items,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const formationId =
    typeof body.formationId === 'string' && body.formationId.trim()
      ? body.formationId.trim()
      : null;

  if (!title) return fail('Intitulé de banque requis.', 400);
  if (!formationId) return fail('formationId requis.', 400);

  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    select: { id: true },
  });
  if (!formation) return fail('Formation introuvable.', 404);

  const bank = await prisma.quizQuestionBank.create({
    data: {
      title,
      formationId,
      courseId: typeof body.courseId === 'string' ? body.courseId : null,
      createdById: session.user.id,
    },
    include: {
      formation: { select: { id: true, name: true, slug: true } },
      _count: { select: { items: true } },
    },
  });

  return ok(
    {
      item: {
        id: bank.id,
        title: bank.title,
        formationId: bank.formationId,
        courseId: bank.courseId,
        formation: bank.formation,
        itemCount: bank._count.items,
        createdAt: bank.createdAt.toISOString(),
        updatedAt: bank.updatedAt.toISOString(),
      },
    },
    201,
  );
}
