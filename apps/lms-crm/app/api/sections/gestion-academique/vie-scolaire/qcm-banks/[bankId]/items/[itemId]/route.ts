import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ bankId: string; itemId: string }> };

function parseChoices(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const choices = raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return choices.length >= 2 ? choices : null;
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { bankId, itemId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const existing = await prisma.quizQuestionBankItem.findFirst({
    where: { id: itemId, bankId },
    select: { id: true, choices: true },
  });
  if (!existing) return fail('Question introuvable.', 404);

  const data: {
    prompt?: string;
    choices?: string[];
    correctIndex?: number;
    position?: number;
    tags?: string[];
    chapterId?: string | null;
  } = {};

  if (typeof body.prompt === 'string' && body.prompt.trim()) data.prompt = body.prompt.trim();
  if (body.choices !== undefined) {
    const choices = parseChoices(body.choices);
    if (!choices) return fail('Au moins 2 réponses proposées.', 400);
    data.choices = choices;
  }
  if (typeof body.correctIndex === 'number') data.correctIndex = body.correctIndex;
  if (typeof body.position === 'number') data.position = body.position;
  if (Array.isArray(body.tags)) {
    data.tags = (body.tags as unknown[]).filter((t): t is string => typeof t === 'string');
  }
  if (body.chapterId !== undefined) {
    if (body.chapterId === null || body.chapterId === '') {
      data.chapterId = null;
    } else if (typeof body.chapterId === 'string') {
      const chapter = await prisma.chapter.findUnique({
        where: { id: body.chapterId },
        select: { id: true },
      });
      if (!chapter) return fail('UV introuvable.', 422);
      data.chapterId = body.chapterId;
    }
  }

  const choices =
    data.choices ??
    (Array.isArray(existing.choices)
      ? existing.choices.filter((v): v is string => typeof v === 'string')
      : []);
  const correctIndex = data.correctIndex ?? 0;
  if (correctIndex < 0 || correctIndex >= choices.length) {
    return fail('Index de bonne réponse invalide.', 400);
  }

  const item = await prisma.quizQuestionBankItem.update({
    where: { id: itemId },
    data,
    include: { chapter: { select: { id: true, title: true, position: true } } },
  });

  return ok({
    item: {
      id: item.id,
      position: item.position,
      prompt: item.prompt,
      choices: item.choices,
      correctIndex: item.correctIndex,
      tags: item.tags,
      chapterId: item.chapterId,
      chapter: item.chapter,
    },
  });
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { bankId, itemId } = await context.params;
  const existing = await prisma.quizQuestionBankItem.findFirst({
    where: { id: itemId, bankId },
    select: { id: true },
  });
  if (!existing) return fail('Question introuvable.', 404);

  await prisma.quizQuestionBankItem.delete({ where: { id: itemId } });
  return ok({ deleted: true });
}
