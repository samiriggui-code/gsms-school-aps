import { createHash } from 'node:crypto';
import type { Session } from 'next-auth';
import type { FileAsset, FileAssetVisibility, Prisma } from '@repo/database';
import { uploadFile, type StorageVisibility } from '@repo/storage';
import { prisma } from '@/lib/prisma';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

export type FileAssetAccessRecord = { visibility: FileAssetVisibility; createdById: string | null };

/**
 * Lecture d'un fichier — respecte la visibilité déclarée (PUBLIC/INTERNAL/PRIVATE).
 * Un fichier PRIVATE sans créateur tracé reste lisible par tout utilisateur authentifié
 * (TODO GSMS-SEC-03 : remplacer par une ACL par entité liée quand elle existera).
 */
export function canReadFileAsset(
  session: Session | null | undefined,
  asset: FileAssetAccessRecord,
): boolean {
  if (asset.visibility === 'PUBLIC') return true;
  const userId = session?.user?.id;
  if (!userId) return false;
  if (asset.visibility === 'INTERNAL') return true;
  if (!asset.createdById) return true;
  return asset.createdById === userId || sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin);
}

/**
 * Gestion (modification de métadonnées, suppression) — réservée au créateur du fichier
 * ou à un titulaire de la permission gouvernance de stockage. Jamais « authentifié = autorisé ».
 */
export function canManageFileAsset(
  session: Session | null | undefined,
  asset: { createdById: string | null },
): boolean {
  const userId = session?.user?.id;
  if (!userId) return false;
  if (sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)) return true;
  return Boolean(asset.createdById) && asset.createdById === userId;
}

export type CreateFileAssetInput = {
  file: File;
  module: string;
  entityType: string;
  entityId?: string | null;
  category?: string | null;
  visibility?: FileAssetVisibility;
  createdById?: string | null;
  changeReason?: string;
  metadata?: Record<string, unknown>;
};

function toStorageVisibility(v: FileAssetVisibility): StorageVisibility {
  if (v === 'PUBLIC') return 'public';
  if (v === 'INTERNAL') return 'internal';
  return 'private';
}

function sha256Buffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export async function createFileAssetWithVersion(
  input: CreateFileAssetInput,
): Promise<FileAsset> {
  const visibility = input.visibility ?? 'PRIVATE';
  const body = Buffer.from(await input.file.arrayBuffer());
  const checksum = sha256Buffer(body);

  const uploaded = await uploadFile({
    file: input.file,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId,
    category: input.category,
    visibility: toStorageVisibility(visibility),
  });

  return prisma.$transaction(async (tx) => {
    const asset = await tx.fileAsset.create({
      data: {
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        category: input.category ?? null,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        storageKey: uploaded.key,
        url: uploaded.url,
        visibility,
        provider: 's3',
        createdById: input.createdById ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonObject,
      },
    });

    const version = await tx.fileAssetVersion.create({
      data: {
        fileAssetId: asset.id,
        versionNumber: 1,
        storageKey: uploaded.key,
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        checksum,
        changeReason: input.changeReason ?? 'Création initiale',
        status: 'ACTIVE',
        createdById: input.createdById ?? null,
      },
    });

    return tx.fileAsset.update({
      where: { id: asset.id },
      data: { currentVersionId: version.id },
    });
  }).then((asset) => {
    void notifyComplianceAfterFileUpload(asset);
    return asset;
  });
}

async function notifyComplianceAfterFileUpload(asset: FileAsset): Promise<void> {
  if (!asset.entityId) return;
  try {
    const { ComplianceService } = await import('@repo/api-core/compliance-service');
    const service = new ComplianceService(prisma);
    await service.onFileAssetUploaded(asset.entityId, asset.category, asset.id);
  } catch (error) {
    console.warn('[compliance] post-upload:', error);
  }
}

export async function ensureFileAssetHasVersion(assetId: string): Promise<void> {
  const asset = await prisma.fileAsset.findUnique({ where: { id: assetId } });
  if (!asset || asset.currentVersionId) return;

  await prisma.fileAssetVersion.create({
    data: {
      fileAssetId: asset.id,
      versionNumber: 1,
      storageKey: asset.storageKey,
      url: asset.url,
      mimeType: asset.mimeType,
      size: asset.size,
      changeReason: 'Migration version initiale',
      status: asset.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
      createdById: asset.createdById,
    },
  }).then(async (version) => {
    await prisma.fileAsset.update({
      where: { id: asset.id },
      data: { currentVersionId: version.id },
    });
  });
}

export async function archiveFileAsset(params: {
  assetId: string;
  reason: string;
  userId?: string;
  legalHold?: boolean;
  retentionUntil?: Date | null;
}) {
  const asset = await prisma.fileAsset.findUnique({
    where: { id: params.assetId },
    include: { currentVersion: true },
  });
  if (!asset) throw new Error('Fichier introuvable.');
  if (asset.legalHold && !params.legalHold) {
    throw new Error('Fichier sous conservation légale — archivage bloqué.');
  }

  await ensureFileAssetHasVersion(asset.id);

  return prisma.$transaction(async (tx) => {
    if (asset.currentVersionId) {
      await tx.fileAssetVersion.update({
        where: { id: asset.currentVersionId },
        data: {
          status: params.legalHold ? 'LEGAL_HOLD' : 'ARCHIVED',
        },
      });
    }

    return tx.fileAsset.update({
      where: { id: asset.id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        archiveReason: params.reason,
        legalHold: params.legalHold ?? asset.legalHold,
        retentionUntil: params.retentionUntil ?? asset.retentionUntil,
        metadata: {
          ...(typeof asset.metadata === 'object' && asset.metadata && !Array.isArray(asset.metadata)
            ? (asset.metadata as Record<string, unknown>)
            : {}),
          archivedBy: params.userId ?? null,
        } as Prisma.InputJsonObject,
      },
    });
  });
}

export async function addFileAssetVersion(params: {
  assetId: string;
  file: File;
  changeReason: string;
  createdById?: string;
}) {
  const asset = await prisma.fileAsset.findUnique({
    where: { id: params.assetId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
  if (!asset) throw new Error('Fichier introuvable.');
  if (asset.status === 'ARCHIVED' || asset.status === 'DELETED') {
    throw new Error('Impossible de versionner un fichier archivé ou supprimé.');
  }

  await ensureFileAssetHasVersion(asset.id);

  const nextVersion = (asset.versions[0]?.versionNumber ?? 0) + 1;
  const body = Buffer.from(await params.file.arrayBuffer());
  const checksum = sha256Buffer(body);

  const uploaded = await uploadFile({
    file: params.file,
    module: asset.module,
    entityType: asset.entityType,
    entityId: asset.entityId,
    category: asset.category,
    visibility: toStorageVisibility(asset.visibility),
  });

  return prisma.$transaction(async (tx) => {
    if (asset.currentVersionId) {
      await tx.fileAssetVersion.update({
        where: { id: asset.currentVersionId },
        data: { status: 'SUPERSEDED' },
      });
    }

    const version = await tx.fileAssetVersion.create({
      data: {
        fileAssetId: asset.id,
        versionNumber: nextVersion,
        storageKey: uploaded.key,
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        checksum,
        changeReason: params.changeReason,
        status: 'ACTIVE',
        createdById: params.createdById ?? null,
      },
    });

    return tx.fileAsset.update({
      where: { id: asset.id },
      data: {
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        storageKey: uploaded.key,
        url: uploaded.url,
        currentVersionId: version.id,
        status: 'ACTIVE',
        archivedAt: null,
        archiveReason: null,
      },
    });
  });
}

export function resolvePreviewKind(mimeType: string): 'pdf' | 'image' | 'excel' | 'csv' | 'other' {
  const m = mimeType.toLowerCase();
  if (m === 'application/pdf') return 'pdf';
  if (m.startsWith('image/')) return 'image';
  if (
    m.includes('spreadsheet') ||
    m.includes('excel') ||
    m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    m === 'application/vnd.ms-excel'
  ) {
    return 'excel';
  }
  if (m === 'text/csv' || m.endsWith('/csv')) return 'csv';
  return 'other';
}

export async function loadAssetBytes(assetId: string) {
  const { getStoredFile, resolveKeyFromUrl } = await import('@repo/storage');
  const asset = await prisma.fileAsset.findUnique({
    where: { id: assetId },
    include: { currentVersion: true },
  });
  if (!asset) return null;

  const keysToTry = [
    asset.currentVersion?.storageKey,
    asset.storageKey,
    asset.url ? resolveKeyFromUrl(asset.url) : null,
  ].filter((key): key is string => Boolean(key?.trim()));

  let file = null;
  for (const key of keysToTry) {
    file = await getStoredFile(key);
    if (file) break;
  }

  if (!file && asset.url && /^https?:\/\//i.test(asset.url)) {
    try {
      const res = await fetch(asset.url, { signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        file = {
          body: bytes,
          contentType: res.headers.get('content-type') || asset.mimeType || 'application/octet-stream',
          cacheControl: 'private, max-age=60',
        };
      }
    } catch {
      // Pas de blob local ni URL distante joignable.
    }
  }

  if (!file) return null;
  return { asset, file };
}

export async function parseExcelPreview(buffer: Buffer, maxRows = 50) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  // exceljs types expect Node Buffer; runtime accepts Uint8Array
  await workbook.xlsx.load(buffer as never);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { sheetName: '', headers: [] as string[], rows: [] as string[][] };

  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > maxRows + 1) return;
    const values = row.values as (string | number | null | undefined)[];
    const cells = values.slice(1).map((v) => (v == null ? '' : String(v)));
    rows.push(cells);
  });

  const headers = rows.shift() ?? [];
  return { sheetName: sheet.name, headers, rows };
}