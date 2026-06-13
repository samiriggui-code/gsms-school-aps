import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { CandidatureStatus, UserStatus } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { applyCandidatureStatusChange } from '@repo/api-core';
import { disableLearnerAccess } from '@/lib/rh/account-lifecycle';

type BatchAction = 'archive' | 'reject' | 'disable_access';

export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const action = body.action as BatchAction;
  const ids = Array.isArray(body.candidatureIds)
    ? body.candidatureIds.filter(
        (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0,
      )
    : [];

  if (!ids.length) return fail('candidatureIds requis', 400);
  if (action !== 'archive' && action !== 'reject' && action !== 'disable_access') {
    return fail('action invalide (archive | reject | disable_access)', 400);
  }

  if (action === 'disable_access') {
    let updated = 0;
    const errors: string[] = [];
    for (const candidatureId of ids) {
      try {
        await disableLearnerAccess(candidatureId, auth.session.user.id);
        updated += 1;
      } catch (e) {
        errors.push(`${candidatureId}: ${e instanceof Error ? e.message : 'erreur'}`);
      }
    }
    return ok({ action, requested: ids.length, updated, errors });
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
      await prisma.$transaction(async (tx) => {
        await applyCandidatureStatusChange(tx, c.id, targetStatus, {
          userId: c.userId,
          status: c.status,
        });
        if (action === 'reject') {
          await tx.user.update({
            where: { id: c.userId },
            data: { status: UserStatus.BLOCKED },
          });
        }
      });
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
