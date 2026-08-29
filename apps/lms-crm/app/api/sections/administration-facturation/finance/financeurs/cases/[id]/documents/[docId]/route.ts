import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

const DOC_STATUSES = new Set(['MISSING', 'UPLOADED', 'VALIDATED', 'REJECTED']);

type RouteParams = { params: Promise<{ id: string; docId: string }> };

/** PATCH — statut / fileAssetId d’une pièce. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id: caseId, docId } = await params;
  try {
    const existing = await prisma.fundingDocument.findFirst({
      where: { id: docId, caseId },
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

    const updated = await prisma.fundingDocument.update({
      where: { id: docId },
      data,
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
