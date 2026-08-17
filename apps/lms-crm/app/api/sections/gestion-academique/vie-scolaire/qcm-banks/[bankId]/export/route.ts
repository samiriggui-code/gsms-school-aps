import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ bankId: string }> };

/** Export JSON banque QCM (session blanche / impression). */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { bankId } = await context.params;
  const row = await prisma.quizQuestionBank.findUnique({
    where: { id: bankId },
    include: {
      formation: { select: { id: true, name: true, slug: true } },
      items: {
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        include: { chapter: { select: { id: true, title: true, position: true } } },
      },
    },
  });
  if (!row) return fail('Banque introuvable.', 404);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    bank: { id: row.id, title: row.title },
    formation: row.formation,
    questions: row.items.map((item) => ({
      position: item.position,
      prompt: item.prompt,
      choices: item.choices,
      uv: item.chapter
        ? { id: item.chapter.id, title: item.chapter.title, position: item.chapter.position }
        : item.tags.length > 0
          ? { tag: item.tags[0] }
          : null,
    })),
  };

  const safeName = row.title.replace(/[^\w\-]+/g, '_').slice(0, 50);
  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="qcm-${safeName}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
