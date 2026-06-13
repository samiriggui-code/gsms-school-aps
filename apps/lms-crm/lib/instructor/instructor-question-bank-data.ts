import { prisma } from '@/lib/prisma';

export type QuestionBankItemRow = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  tags: string[];
};

export type QuestionBankRow = {
  id: string;
  title: string;
  itemCount: number;
  items: QuestionBankItemRow[];
};

function parseChoices(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

export async function listQuestionBanksForCourse(
  courseId: string,
  formationId: string | null,
): Promise<QuestionBankRow[]> {
  const banks = await prisma.quizQuestionBank.findMany({
    where: {
      OR: [{ courseId }, ...(formationId ? [{ formationId }] : [])],
    },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      items: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          prompt: true,
          choices: true,
          correctIndex: true,
          tags: true,
        },
      },
    },
  });

  return banks.map((b) => ({
    id: b.id,
    title: b.title,
    itemCount: b.items.length,
    items: b.items.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      choices: parseChoices(item.choices),
      correctIndex: item.correctIndex,
      tags: item.tags,
    })),
  }));
}

export async function ensureDefaultQuestionBank(
  courseId: string,
  formationId: string,
  createdById: string,
): Promise<string> {
  const existing = await prisma.quizQuestionBank.findFirst({
    where: { formationId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const bank = await prisma.quizQuestionBank.create({
    data: {
      title: 'Banque QCM formation',
      formationId,
      courseId,
      createdById,
    },
    select: { id: true },
  });
  return bank.id;
}
