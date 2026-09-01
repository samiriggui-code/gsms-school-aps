import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ bankId: string }> };

function parseChoices(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const choices = raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return choices.length >= 2 ? choices : null;
}

export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { bankId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const bank = await prisma.quizQuestionBank.findUnique({
    where: { id: bankId },
    select: { id: true },
  });
  if (!bank) return fail('Banque introuvable.', 404);

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const choices = parseChoices(body.choices);
  const correctIndex = typeof body.correctIndex === 'number' ? body.correctIndex : 0;
  const chapterId =
    typeof body.chapterId === 'string' && body.chapterId.trim() ? body.chapterId.trim() : null;
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  if (!prompt) return fail('Énoncé requis.', 400);
  if (!choices) return fail('Au moins 2 réponses proposées.', 400);
  if (correctIndex < 0 || correctIndex >= choices.length) {
    return fail('Index de bonne réponse invalide.', 400);
  }

  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true },
    });
    if (!chapter) return fail('UV / chapitre introuvable.', 422);
  }

  const maxPos = await prisma.quizQuestionBankItem.aggregate({
    where: { bankId },
    _max: { position: true },
  });
  const position =
    typeof body.position === 'number' ? body.position : (maxPos._max.position ?? 0) + 1;

  const item = await prisma.quizQuestionBankItem.create({
    data: {
      bankId,
      position,
      prompt,
      choices,
      correctIndex,
      tags,
      chapterId,
    },
    include: { chapter: { select: { id: true, title: true, position: true } } },
  });

  return ok(
    {
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
    },
    201,
  );
}
