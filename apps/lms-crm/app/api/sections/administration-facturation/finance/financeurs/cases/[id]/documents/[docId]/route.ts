import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

const DOC_STATUSES = new Set(['MISSING', 'UPLOADED', 'VALIDATED', 'REJECTED']);

type RouteParams = { params: Promise<{ id: string; docId: string }> };

/** PATCH — statut / fileAssetId d’une pièce. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { id: caseId, docId } = await params;
  try {
    const existing = await prisma.fundingDocument.findFirst({
      where: { id: docId, caseId },
      include: { case: { select: { sessionId: true, learnerUserId: true } } },
    });
    if (!existing) return fail('FundingDocument not found', 404);

    const body = (await request.json()) as {
      status?: string;
      fileAssetId?: string | null;
      label?: string;
    };

    const data: { status?: string; fileAssetId?: string | null; label?: string } = {};
    if (body.status !== undefined) {
      if (!DOC_STATUSES.has(body.status)) return fail('Invalid status', 400);
      data.status = body.status;
    }
    if (body.fileAssetId !== undefined) {
      data.fileAssetId = body.fileAssetId;
      if (body.fileAssetId && !body.status) {
        data.status = 'UPLOADED';
      }
    }
    if (body.label?.trim()) data.label = body.label.trim();

    if (Object.keys(data).length === 0) return fail('No fields to update', 400);

    const fromStatus = existing.status;
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.fundingDocument.update({
        where: { id: docId },
        data,
      });
      if (data.status && data.status !== fromStatus) {
        await recordStatusEvidence(tx, {
          category: 'funding_document',
          sourceType: data.status === 'UPLOADED' || data.fileAssetId ? 'DOCUMENT' : 'HISTORIQUE',
          sourceId: docId,
          eventName: 'FUNDING_DOCUMENT_STATUS_CHANGED',
          fromStatus,
          toStatus: data.status,
          sessionId: existing.case.sessionId,
          learnerUserId: existing.case.learnerUserId,
          metadata: {
            caseId,
            code: existing.code,
            fileAssetId: row.fileAssetId,
          },
        });
      }
      return row;
    });
    return ok(updated);
  } catch (e) {
    console.error('[financeurs/cases/documents/[docId]] PATCH', e);
    return fail('Failed to update funding document', 500);
  }
}

/** DELETE — retirer une pièce. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { id: caseId, docId } = await params;
  try {
    const existing = await prisma.fundingDocument.findFirst({
      where: { id: docId, caseId },
      select: { id: true },
    });
    if (!existing) return fail('FundingDocument not found', 404);

    await prisma.fundingDocument.delete({ where: { id: docId } });
    return ok({ id: docId, deleted: true });
  } catch (e) {
    console.error('[financeurs/cases/documents/[docId]] DELETE', e);
    return fail('Failed to delete funding document', 500);
  }
}
