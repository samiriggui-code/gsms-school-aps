import { prisma } from '@/lib/prisma';
import type { SessionAttendanceAssetRow } from '@/lib/instructor/instructor-types';

export type { SessionAttendanceAssetRow };

const MODULE = 'gestion-academique';
const ENTITY_TYPE = 'formation_session';
export const ATTENDANCE_CATEGORY_BLANK = 'attendance-pdf-blank';
export const ATTENDANCE_CATEGORY_SCAN = 'attendance-scan';

function parseAttendanceDate(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const d = (metadata as Record<string, unknown>).attendanceDate;
  return typeof d === 'string' ? d : null;
}

function parseKind(metadata: unknown, category: string | null): 'generated' | 'scan' {
  if (category === ATTENDANCE_CATEGORY_SCAN) return 'scan';
  if (category === ATTENDANCE_CATEGORY_BLANK) return 'generated';
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const k = (metadata as Record<string, unknown>).kind;
    if (k === 'scan') return 'scan';
  }
  return 'generated';
}

export async function listSessionAttendanceAssets(sessionId: string): Promise<SessionAttendanceAssetRow[]> {
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      status: 'ACTIVE',
      category: { in: [ATTENDANCE_CATEGORY_BLANK, ATTENDANCE_CATEGORY_SCAN] },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      originalName: true,
      url: true,
      mimeType: true,
      size: true,
      category: true,
      metadata: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    originalName: r.originalName,
    url: r.url,
    mimeType: r.mimeType,
    size: r.size,
    category: r.category ?? ATTENDANCE_CATEGORY_BLANK,
    attendanceDate: parseAttendanceDate(r.metadata),
    kind: parseKind(r.metadata, r.category),
    createdAt: r.createdAt.toISOString(),
    createdByName: r.createdBy?.name ?? null,
  }));
}

export async function storeSessionAttendanceScan(input: {
  sessionId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  attendanceDate: string;
  createdById: string;
}) {
  const { uploadFile } = await import('@repo/storage');
  const file = new File([Uint8Array.from(input.buffer)], input.filename, {
    type: input.mimeType,
  });

  const uploaded = await uploadFile({
    file,
    module: MODULE,
    entityType: ENTITY_TYPE,
    entityId: input.sessionId,
    category: ATTENDANCE_CATEGORY_SCAN,
    visibility: 'internal',
  });

  return prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category: ATTENDANCE_CATEGORY_SCAN,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: 'INTERNAL',
      provider: 's3',
      createdById: input.createdById,
      metadata: {
        attendanceDate: input.attendanceDate,
        kind: 'scan',
        sessionId: input.sessionId,
      },
    },
  });
}

export async function storeSessionAttendanceGenerated(input: {
  sessionId: string;
  buffer: Buffer;
  filename: string;
  attendanceDate: string;
  createdById: string;
}) {
  const { uploadFile } = await import('@repo/storage');
  const file = new File([Uint8Array.from(input.buffer)], input.filename, {
    type: 'application/pdf',
  });

  const uploaded = await uploadFile({
    file,
    module: MODULE,
    entityType: ENTITY_TYPE,
    entityId: input.sessionId,
    category: ATTENDANCE_CATEGORY_BLANK,
    visibility: 'internal',
  });

  return prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category: ATTENDANCE_CATEGORY_BLANK,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: 'INTERNAL',
      provider: 's3',
      createdById: input.createdById,
      metadata: {
        attendanceDate: input.attendanceDate,
        kind: 'generated',
        sessionId: input.sessionId,
      },
    },
  });
}
