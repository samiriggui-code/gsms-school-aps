import { NextRequest } from 'next/server';
import type { ComplianceItemStatus } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesEdit } from '../../../_lib/require-gestion-ressources-auth';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

type Ctx = { params: Promise<{ itemId: string }> };

type QualiopiAuditStatus = 'OK' | 'KO' | 'TO_FIX' | 'NA';

const AUDIT_MAP: Record<QualiopiAuditStatus, ComplianceItemStatus> = {
  OK: 'VALIDATED',
  KO: 'REJECTED',
  NA: 'WAIVED',
  TO_FIX: 'REQUESTED',
};

const SATISFIED: ComplianceItemStatus[] = ['RECEIVED', 'VALIDATED', 'WAIVED'];

async function recompute(dossierId: string) {
  const items = await prisma.complianceDossierItem.findMany({
    where: { dossierId },
    select: { required: true, status: true },
  });
  const applicable = items.filter((i) => i.required);
  const total = applicable.length || 1;
  const satisfied = applicable.filter((i) => SATISFIED.includes(i.status)).length;
  const completenessPct = Math.round((satisfied / total) * 100);
  const hasExpired = items.some((i) => i.required && i.status === 'EXPIRED');
  const missingCount = applicable.filter((i) => !SATISFIED.includes(i.status)).length;
  const status = hasExpired ? 'EXPIRED' : missingCount === 0 ? 'COMPLETE' : 'INCOMPLETE';
  await prisma.complianceDossier.update({ where: { id: dossierId }, data: { completenessPct, status } });
}

/** Mise à jour audit / preuve d'un indicateur Qualiopi — Gestion ressources. */
export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { itemId } = await context.params;
  if (!itemId?.trim()) return fail('itemId requis', 400);

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide', 400);
  }

  try {
    const existing = await prisma.complianceDossierItem.findUnique({ where: { id: itemId } });
    if (!existing) return fail('Indicateur introuvable', 404);

    const auditRaw = typeof body.auditStatus === 'string' ? body.auditStatus : null;
    const mapped = auditRaw && auditRaw in AUDIT_MAP ? AUDIT_MAP[auditRaw as QualiopiAuditStatus] : null;
    const comment =
      typeof body.comment === 'string' && body.comment.trim() ? body.comment.trim() : null;
    const fileAssetId = typeof body.fileAssetId === 'string' ? body.fileAssetId : undefined;

    const data: Record<string, unknown> = {};
    if (mapped) {
      data.status = mapped;
      data.rejectionReason = comment;
      data.validatedAt = mapped === 'REQUESTED' ? null : new Date();
      data.validatedById = mapped === 'REQUESTED' ? null : auth.userId;
    } else if (comment !== null) {
      data.rejectionReason = comment;
    }
    if (fileAssetId !== undefined) data.fileAssetId = fileAssetId;

    if (Object.keys(data).length === 0) return fail('Aucune modification', 400);

    const fromStatus = existing.status;
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.complianceDossierItem.update({
        where: { id: itemId },
        data,
        select: {
          id: true,
          code: true,
          label: true,
          status: true,
          fileCategory: true,
          fileAssetId: true,
          rejectionReason: true,
          dossierId: true,
          fileAsset: { select: { id: true, url: true, originalName: true } },
        },
      });

      await tx.complianceItemEvent.create({
        data: {
          dossierId: row.dossierId,
          dossierItemId: row.id,
          eventType: 'ITEM_UPDATED',
          actorId: auth.userId,
          payload: { status: row.status, fileAssetId: row.fileAssetId },
        },
      });

      if (data.status && row.status !== fromStatus) {
        await recordStatusEvidence(tx, {
          category: 'qualiopi_item',
          sourceType: row.fileAssetId ? 'DOCUMENT' : 'VALIDATION',
          sourceId: row.id,
          eventName: 'COMPLIANCE_ITEM_STATUS_CHANGED',
          fromStatus,
          toStatus: row.status,
          metadata: {
            indicatorCode: row.code,
            dossierId: row.dossierId,
          },
        });
      }

      return row;
    });

    await recompute(updated.dossierId);

    return ok({ item: updated });
  } catch (e) {
    console.error('[qualiopi item PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}
