import { prisma } from '@/lib/prisma';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import type { EntityDefinition } from '@/lib/framework/entity';
import type { ComplianceItemStatus } from '@repo/database';

/**
 * Entité framework (DocType-like) exposant `ComplianceDossierItem` en lecture/écriture
 * via /api/entities/complianceDossierItem — utilisée par le classeur Qualiopi (GSMS-OF-05).
 *
 * `auditStatus`/`comment` sont des champs virtuels (pas de colonne Prisma) : le hook
 * `beforeUpdate` les traduit vers les colonnes réelles (status/rejectionReason/validatedAt/
 * validatedById). Statuts d'audit métier OK/KO/TO_FIX/NA → ComplianceItemStatus
 * VALIDATED/REJECTED/WAIVED/REQUESTED.
 */

type QualiopiAuditStatus = 'OK' | 'KO' | 'TO_FIX' | 'NA';

const QUALIOPI_AUDIT_STATUS_MAP: Record<QualiopiAuditStatus, ComplianceItemStatus> = {
  OK: 'VALIDATED',
  KO: 'REJECTED',
  NA: 'WAIVED',
  TO_FIX: 'REQUESTED',
};

const SATISFIED_STATUSES: ComplianceItemStatus[] = ['RECEIVED', 'VALIDATED', 'WAIVED'];

/** Recalcule complétude/statut du dossier — logique dédiée (pas ComplianceService.evaluateDossier,
 * dont le balayage auto par FileAsset/legacy User ne s'applique pas à un dossier SCHOOL et
 * réinitialiserait les items REJECTED/REQUESTED vers MISSING). */
async function recomputeQualiopiDossierAggregate(dossierId: string): Promise<void> {
  const items = await prisma.complianceDossierItem.findMany({
    where: { dossierId },
    select: { required: true, status: true },
  });

  const applicable = items.filter((i) => i.required);
  const total = applicable.length || 1;
  const satisfied = applicable.filter((i) => SATISFIED_STATUSES.includes(i.status)).length;
  const completenessPct = Math.round((satisfied / total) * 100);
  const hasExpired = items.some((i) => i.required && i.status === 'EXPIRED');
  const missingCount = applicable.filter((i) => !SATISFIED_STATUSES.includes(i.status)).length;
  const status = hasExpired ? 'EXPIRED' : missingCount === 0 ? 'COMPLETE' : 'INCOMPLETE';

  await prisma.complianceDossier.update({ where: { id: dossierId }, data: { completenessPct, status } });
}

export const qualiopiComplianceDossierItemEntity: EntityDefinition = {
  name: 'complianceDossierItem',
  label: 'Pièce de dossier conformité',
  prismaModel: 'complianceDossierItem',
  permissions: {
    GET: CRM_PERMISSION.securiteView,
    POST: CRM_PERMISSION.securiteEdit,
    PATCH: CRM_PERMISSION.securiteEdit,
    DELETE: CRM_PERMISSION.securiteEdit,
  },
  fields: [
    { name: 'id', type: 'string', label: 'ID', readOnly: true },
    { name: 'dossierId', type: 'string', label: 'Dossier', readOnly: true },
    { name: 'code', type: 'string', label: 'Code', readOnly: true, search: true },
    { name: 'label', type: 'string', label: 'Libellé', readOnly: true, search: true },
    { name: 'status', type: 'string', label: 'Statut', readOnly: true },
    {
      name: 'auditStatus',
      type: 'select',
      label: 'Statut audit',
      options: [
        { value: 'OK', label: 'OK' },
        { value: 'KO', label: 'KO' },
        { value: 'TO_FIX', label: 'À réparer' },
        { value: 'NA', label: 'N/A' },
      ],
    },
    { name: 'comment', type: 'text', label: 'Commentaire' },
    { name: 'fileAssetId', type: 'string', label: 'Preuve' },
    { name: 'rejectionReason', type: 'text', label: 'Motif', readOnly: true },
    { name: 'validatedAt', type: 'date', label: 'Audité le', readOnly: true },
    { name: 'validatedById', type: 'string', label: 'Audité par', readOnly: true },
  ],
  list: {
    defaultSort: 'code',
    include: {
      fileAsset: { select: { id: true, url: true, originalName: true } },
    },
    dynamicWhere: ({ searchParams }) => {
      const dossierId = searchParams.get('dossierId');
      return dossierId ? { dossierId } : undefined;
    },
  },
  hooks: {
    beforeUpdate: async ({ userId, data }) => {
      const auditStatus =
        typeof data.auditStatus === 'string' ? (data.auditStatus as QualiopiAuditStatus) : null;
      const mappedStatus = auditStatus ? QUALIOPI_AUDIT_STATUS_MAP[auditStatus] : null;

      if (!mappedStatus) {
        const { auditStatus: _a, comment: _c, ...rest } = data;
        return rest;
      }

      const comment = typeof data.comment === 'string' && data.comment.trim() ? data.comment.trim() : null;
      const next: Record<string, unknown> = {
        status: mappedStatus,
        rejectionReason: comment,
        validatedAt: mappedStatus === 'REQUESTED' ? null : new Date(),
        validatedById: mappedStatus === 'REQUESTED' ? null : userId,
      };
      if (typeof data.fileAssetId === 'string') next.fileAssetId = data.fileAssetId;
      return next;
    },
    afterUpdate: async ({ userId, record }) => {
      const dossierId = record?.dossierId as string | undefined;
      const itemId = record?.id as string | undefined;
      if (!dossierId || !itemId) return;

      await prisma.complianceItemEvent.create({
        data: {
          dossierId,
          dossierItemId: itemId,
          eventType: 'ITEM_UPDATED',
          actorId: userId,
          payload: {
            status: String(record?.status ?? ''),
            fileAssetId: (record?.fileAssetId as string | null) ?? null,
          },
        },
      });

      await recomputeQualiopiDossierAggregate(dossierId);
    },
  },
};
