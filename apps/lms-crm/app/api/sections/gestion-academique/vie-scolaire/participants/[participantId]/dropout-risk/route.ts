import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { DropoutRiskStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  DropoutRiskError,
  advanceDropoutRisk,
} from '@/lib/vie-scolaire/dropout-risk-service';

type Ctx = { params: Promise<{ participantId: string }> };

const ALLOWED = new Set(Object.values(DropoutRiskStatus));

/** WF-19 — avance le cycle de risque de rupture (forward-only). */
export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { participantId } = await context.params;
  let body: { dropoutRiskStatus?: string; notes?: string } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const nextStatus = body.dropoutRiskStatus?.trim();
  if (!nextStatus || !ALLOWED.has(nextStatus as DropoutRiskStatus)) {
    return fail('dropoutRiskStatus invalide.', 400);
  }
  if (nextStatus === 'NONE' || nextStatus === 'FLAGGED') {
    return fail('Seules les transitions staff CONTACTED → ACTION_PROPOSED → RESOLVED sont autorisées ici.', 400);
  }

  try {
    const updated = await advanceDropoutRisk(
      prisma,
      participantId,
      nextStatus as DropoutRiskStatus,
      typeof body.notes === 'string' ? body.notes : undefined,
    );
    return ok({
      ...updated,
      dropoutRiskFlaggedAt: updated.dropoutRiskFlaggedAt?.toISOString() ?? null,
    });
  } catch (e) {
    if (e instanceof DropoutRiskError) {
      if (e.code === 'NOT_FOUND') return fail(e.message, 404);
      return fail(e.message, 400);
    }
    throw e;
  }
}

/** WF-19 — état actuel du risque. */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { participantId } = await context.params;
  const row = await prisma.formationSessionParticipant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      dropoutRiskStatus: true,
      dropoutRiskFlaggedAt: true,
      dropoutRiskReason: true,
      dropoutRiskNotes: true,
    },
  });
  if (!row) return fail('Participant introuvable.', 404);

  return ok({
    ...row,
    dropoutRiskFlaggedAt: row.dropoutRiskFlaggedAt?.toISOString() ?? null,
  });
}
