import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { CandidatureStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { applyCandidatureStatusChange } from '@repo/api-core';

type BatchAction = 'archive' | 'reject';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const body = await request.json().catch(() => ({}));
  const action = body.action as BatchAction;
  const ids = Array.isArray(body.candidatureIds)
    ? body.candidatureIds.filter(
        (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0,
      )
    : [];

  if (!ids.length) return fail('candidatureIds requis', 400);
  if (action !== 'archive' && action !== 'reject') {
    return fail('action invalide (archive | reject)', 400);
  }

  const targetStatus =
    action === 'archive' ? CandidatureStatus.ARCHIVED : CandidatureStatus.REJECTED;

  const candidatures = await prisma.candidature.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, userId: true },
  });

  let updated = 0;
  const errors: string[] = [];

  for (const c of candidatures) {
    if (c.status === targetStatus) continue;
    try {
      await prisma.$transaction((tx) =>
        applyCandidatureStatusChange(tx, c.id, targetStatus, {
          userId: c.userId,
          status: c.status,
        }),
      );
      updated += 1;
    } catch (e) {
      errors.push(`${c.id}: ${e instanceof Error ? e.message : 'erreur'}`);
    }
  }

  return ok({
    action,
    requested: ids.length,
    found: candidatures.length,
    updated,
    errors,
  });
}
