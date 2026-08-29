import { SubcontractorQualificationStatus } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { GOVERNANCE_PERMISSION } from '@/lib/auth/crm-permissions';
import { requirePermission } from '@/lib/auth/require-permission';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';
import {
  canSetSubcontractorStatus,
  subcontractorStatusActions,
} from '@/lib/organisation/subcontractor-transitions';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — transition statut WF-39. Body: `{ status }` */
export async function PATCH(request: Request, context: Ctx) {
  const auth = await requirePermission(GOVERNANCE_PERMISSION.conformiteEdit);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  let body: { status?: string; notes?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const next = body.status as SubcontractorQualificationStatus | undefined;
  if (!next || !Object.values(SubcontractorQualificationStatus).includes(next)) {
    return fail('Invalid status', 400);
  }

  try {
    const existing = await prisma.subcontractorRecord.findUnique({ where: { id } });
    if (!existing) return fail('Subcontractor not found', 404);

    if (!canSetSubcontractorStatus(existing.status, next)) {
      return fail(
        `Transition ${existing.status} → ${next} not allowed. Allowed: ${subcontractorStatusActions(existing.status).join(', ') || 'none'}`,
        400,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.subcontractorRecord.update({
        where: { id },
        data: {
          status: next,
          ...(body.notes !== undefined
            ? { notes: typeof body.notes === 'string' ? body.notes.trim() || null : null }
            : {}),
        },
      });
      await tx.subcontractorStatusEvent.create({
        data: {
          subcontractorId: id,
          fromStatus: existing.status,
          toStatus: next,
          source: 'manual',
          actorUserId: auth.userId,
        },
      });
      await recordStatusEvidence(tx, {
        category: 'subcontractor',
        sourceType: 'VALIDATION',
        sourceId: id,
        eventName: 'SUBCONTRACTOR_STATUS_CHANGED',
        fromStatus: existing.status,
        toStatus: next,
        companyId: row.companyId,
        indicatorCodes: ['Q-I27'],
      });
      return row;
    });

    return ok({ item: updated });
  } catch (e) {
    console.error('[sous-traitants] PATCH', e);
    return fail('Failed to update subcontractor', 500);
  }
}
