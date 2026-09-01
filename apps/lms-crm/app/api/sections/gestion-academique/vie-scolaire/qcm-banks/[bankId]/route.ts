import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ bankId: string }> };

const bankInclude = {
  formation: { select: { id: true, name: true, slug: true, courseId: true } },
  items: {
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
    include: {
      chapter: { select: { id: true, title: true, position: true } },
    },
  },
};

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { bankId } = await context.params;
  const row = await prisma.quizQuestionBank.findUnique({
    where: { id: bankId },
    include: bankInclude,
  });
  if (!row) return fail('Banque QCM introuvable.', 404);

  return ok({
    item: {
      id: row.id,
      title: row.title,
      formationId: row.formationId,
      courseId: row.courseId,
      formation: row.formation,
      items: row.items.map((item) => ({
        id: item.id,
        position: item.position,
        prompt: item.prompt,
        choices: item.choices,
        correctIndex: item.correctIndex,
        tags: item.tags,
        chapterId: item.chapterId,
        chapter: item.chapter,
        createdAt: item.createdAt.toISOString(),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { bankId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const title = typeof body.title === 'string' ? body.title.trim() : undefined;
  if (title !== undefined && !title) return fail('Intitulé invalide.', 400);

  try {
    const row = await prisma.quizQuestionBank.update({
      where: { id: bankId },
      data: title !== undefined ? { title } : {},
      include: bankInclude,
    });
    return ok({
      item: {
        id: row.id,
        title: row.title,
        formationId: row.formationId,
        courseId: row.courseId,
        formation: row.formation,
        items: row.items.map((item) => ({
          id: item.id,
          position: item.position,
          prompt: item.prompt,
          choices: item.choices,
          correctIndex: item.correctIndex,
          tags: item.tags,
          chapterId: item.chapterId,
          chapter: item.chapter,
        })),
      },
    });
  } catch {
    return fail('Banque introuvable.', 404);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { bankId } = await context.params;
  try {
    await prisma.quizQuestionBank.delete({ where: { id: bankId } });
    return ok({ deleted: true });
  } catch {
    return fail('Banque introuvable.', 404);
  }
}
