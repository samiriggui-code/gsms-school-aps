import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { createFileAssetWithVersion } from '@/lib/file-asset-service';
import { requireSupportEdit, requireSupportView } from '../../../../_lib/require-support-auth';

type Ctx = { params: Promise<{ ticketId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const { ticketId } = await context.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return fail('Ticket introuvable.', 404);

  const rows = await prisma.ticketAttachment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return ok(
    rows.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  );
}

export async function POST(request: NextRequest, context: Ctx) {
  const auth = await requireSupportEdit();
  if (!auth.ok) return auth.response;

  const { ticketId } = await context.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return fail('Ticket introuvable.', 404);

  const formData = await request.formData();
  const file = formData.get('file');
  const commentId = String(formData.get('commentId') ?? '').trim() || null;

  if (!(file instanceof File)) {
    return fail('Fichier requis.', 400);
  }

  const asset = await createFileAssetWithVersion({
    file,
    module: 'support-qualite',
    entityType: 'ticket',
    entityId: ticketId,
    category: 'attachment',
    visibility: 'INTERNAL',
    createdById: auth.userId,
  });

  const row = await prisma.ticketAttachment.create({
    data: {
      ticketId,
      commentId,
      fileAssetId: asset.id,
      uploadedById: auth.userId,
      fileName: asset.originalName,
      fileUrl: asset.url,
      fileKey: asset.storageKey,
      mimeType: asset.mimeType,
      sizeBytes: asset.size,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return ok(
    {
      ...row,
      createdAt: row.createdAt.toISOString(),
    },
    201,
  );
}
