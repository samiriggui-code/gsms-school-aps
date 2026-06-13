import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';

function mapDocument(doc: {
  id: string;
  originalName: string;
  category: string | null;
  createdAt: Date;
  status: string;
  url: string;
  metadata: unknown;
}) {
  const meta =
    doc.metadata && typeof doc.metadata === 'object' && !Array.isArray(doc.metadata)
      ? (doc.metadata as Record<string, unknown>)
      : {};

  return {
    id: doc.id,
    type: doc.category || 'DOCUMENT',
    number: doc.originalName,
    issueDate: doc.createdAt.toISOString(),
    expiryDate: typeof meta.expiryDate === 'string' ? meta.expiryDate : null,
    status: doc.status,
    fileUrl: doc.url || null,
    notes: typeof meta.notes === 'string' ? meta.notes : null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const where: { entityType: string; entityId?: string } = { entityType: 'User' };
    if (userId) where.entityId = userId;

    const documents = await prisma.fileAsset.findMany({
      where,
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        url: true,
        category: true,
        module: true,
        status: true,
        visibility: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return ok(documents.map(mapDocument));
  } catch (error) {
    return fail('Impossible de récupérer les documents.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;
  const session = auth.session;

  try {
    const body = await request.json();
    const userId = String(body.userId || '').trim();
    if (!userId) return fail('userId requis', 400);

    const user = await prisma.user.findFirst({
      where: { id: userId, isTrashed: false },
      select: { id: true },
    });
    if (!user) return fail('Utilisateur introuvable.', 404);

    const docType = String(body.type || 'DOCUMENT').trim() || 'DOCUMENT';
    const number = String(body.number || docType).trim() || docType;
    const notes = body.notes ? String(body.notes).trim() : null;

    const created = await prisma.fileAsset.create({
      data: {
        module: 'crm',
        entityType: 'User',
        entityId: userId,
        category: docType,
        originalName: number,
        mimeType: 'application/octet-stream',
        size: 0,
        storageKey: `metadata/rh-doc/${randomUUID()}`,
        url: '',
        visibility: 'PRIVATE',
        status: 'ACTIVE',
        metadata: {
          issueDate: body.issueDate ? String(body.issueDate) : null,
          expiryDate: body.expiryDate ? String(body.expiryDate) : null,
          notes,
        },
        createdById: session.user.id,
      },
      select: {
        id: true,
        originalName: true,
        category: true,
        createdAt: true,
        status: true,
        url: true,
        metadata: true,
      },
    });

    return ok(mapDocument(created));
  } catch (error) {
    return fail("Impossible d'enregistrer le document.", 500, error);
  }
}
