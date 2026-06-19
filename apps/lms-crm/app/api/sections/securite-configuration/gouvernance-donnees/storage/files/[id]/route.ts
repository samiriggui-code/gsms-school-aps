import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  archiveFileAsset,
  ensureFileAssetHasVersion,
  resolvePreviewKind,
} from '@/lib/file-asset-service';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  await ensureFileAssetHasVersion(id);

  const asset = await prisma.fileAsset.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
      currentVersion: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!asset) return fail('Fichier introuvable.', 404);

  return ok({
    asset: {
      id: asset.id,
      originalName: asset.originalName,
      module: asset.module,
      entityType: asset.entityType,
      entityId: asset.entityId,
      mimeType: asset.mimeType,
      size: asset.size,
      storageKey: asset.storageKey,
      url: asset.url,
      status: asset.status,
      legalHold: asset.legalHold,
      archivedAt: asset.archivedAt?.toISOString() ?? null,
      archiveReason: asset.archiveReason,
      retentionUntil: asset.retentionUntil?.toISOString() ?? null,
      previewKind: resolvePreviewKind(asset.mimeType),
      createdBy: asset.createdBy,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    },
    versions: asset.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      size: v.size,
      mimeType: v.mimeType,
      status: v.status,
      changeReason: v.changeReason,
      checksum: v.checksum,
      isCurrent: v.id === asset.currentVersionId,
      createdAt: v.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    reason?: string;
    legalHold?: boolean;
    retentionUntil?: string;
  };

  if (body.action !== 'archive') {
    return fail('Action non supportée.', 400);
  }

  const reason = String(body.reason ?? '').trim() || 'Archivage gouvernance';
  try {
    const updated = await archiveFileAsset({
      assetId: id,
      reason,
      userId: session.user.id,
      legalHold: body.legalHold,
      retentionUntil: body.retentionUntil ? new Date(body.retentionUntil) : null,
    });
    return ok({ asset: updated });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Archivage impossible.', 400);
  }
}
