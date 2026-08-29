import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AbsenceJustificationStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

type Ctx = { params: Promise<{ sessionId: string; dayId: string; emargementId: string }> };

const ALLOWED = new Set(Object.values(AbsenceJustificationStatus));

/** WF-18 — avance le cycle de justification d'une absence. */
export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { sessionId, dayId, emargementId } = await context.params;
  let body: { justificationStatus?: string; justificationNote?: string } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as typeof body;
  } catch {
    /* optional */
  }

  const nextStatus = body.justificationStatus?.trim();
  if (!nextStatus || !ALLOWED.has(nextStatus as AbsenceJustificationStatus)) {
    return fail('justificationStatus invalide', 400);
  }

  const row = await prisma.formationSessionEmargement.findFirst({
    where: {
      id: emargementId,
      dayId,
      day: { sessionId },
      status: 'ABSENT',
    },
  });
  if (!row) return fail('Absence introuvable.', 404);

  const updated = await prisma.formationSessionEmargement.update({
    where: { id: emargementId },
    data: {
      justificationStatus: nextStatus as AbsenceJustificationStatus,
      justificationNote:
        typeof body.justificationNote === 'string' ? body.justificationNote.trim() || null : undefined,
      justificationRequestedAt:
        nextStatus === 'JUSTIFICATION_REQUESTED' ? new Date() : row.justificationRequestedAt,
      justificationResolvedAt:
        nextStatus === 'JUSTIFIED' || nextStatus === 'RESOLVED' ? new Date() : row.justificationResolvedAt,
    },
  });

  await recordStatusEvidence(prisma, {
    category: 'session_attendance',
    sourceType: 'RELATION',
    sourceId: emargementId,
    eventName: 'LEARNER_ABSENT',
    fromStatus: row.justificationStatus,
    toStatus: nextStatus,
    sessionId,
    metadata: { dayId, participantId: row.participantId, slot: row.slot },
  });

  return ok({
    id: updated.id,
    justificationStatus: updated.justificationStatus,
    justificationNote: updated.justificationNote,
  });
}
