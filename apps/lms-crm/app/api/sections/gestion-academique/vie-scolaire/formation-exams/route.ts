import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamStatus, Prisma } from '@repo/database';
import { ensureFormationExamForSession } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  formationExamDetailInclude,
  serializeFormationExamRow,
} from './_serialize-formation-exam';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = searchParams.get('status');
  const sessionId = (searchParams.get('sessionId') || '').trim();
  const q = (searchParams.get('q') || '').trim();

  const where: Prisma.FormationExamWhereInput = {
    ...(sessionId ? { sessionId } : {}),
    ...(status && (Object.values(FormationExamStatus) as string[]).includes(status)
      ? { status: status as FormationExamStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { session: { dateDisplayLabel: { contains: q, mode: 'insensitive' } } },
            { session: { formation: { name: { contains: q, mode: 'insensitive' } } } },
            { venueRoom: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.formationExam.count({ where }),
    prisma.formationExam.findMany({
      where,
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: formationExamDetailInclude,
    }),
  ]);

  return ok({
    items: rows.map(serializeFormationExamRow),
    pagination: { page, limit, total },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!sessionId) return fail('sessionId requis.', 400);

  try {
    const row = await prisma.$transaction(async (tx) => {
      await ensureFormationExamForSession(tx, sessionId);
      return tx.formationExam.findUniqueOrThrow({
        where: { sessionId },
        include: formationExamDetailInclude,
      });
    });
    return ok({ item: serializeFormationExamRow(row) }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    if (msg === 'SESSION_NOT_FOUND') return fail('Session introuvable.', 404);
    return fail('Planification examen impossible.', 500, e);
  }
}
