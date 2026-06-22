import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import type { SessionDocumentStorageCategory } from '@repo/storage/constants';
import { buildEmargementPdfFilename } from '@/lib/formation-session-document-storage';
import { ensureSessionSuiviStoragePrefixes } from '@/lib/entity-storage';
import type { FormationSessionDaySlot } from '@repo/database';
import { parseIsoDateOnly } from '@/lib/suivi-formations/session-days';

const MODULE = 'gestion-academique';
const ENTITY_TYPE = 'formation_session';

export const EMARGEMENT_PDF_CATEGORY: Record<FormationSessionDaySlot, string> = {
  MORNING: 'emargement-pdf-morning',
  EVENING: 'emargement-pdf-evening',
};

const STORAGE_CATEGORY: Record<FormationSessionDaySlot, SessionDocumentStorageCategory> = {
  MORNING: 'emargement',
  EVENING: 'emargement',
};

export async function storeSessionSuiviPdfAsset(input: {
  sessionId: string;
  dayId: string;
  dayDateIso: string;
  slot: FormationSessionDaySlot;
  buffer: Buffer;
  filename: string;
  createdById: string;
  category: string;
  storageCategory: SessionDocumentStorageCategory;
}) {
  await ensureSessionSuiviStoragePrefixes(input.sessionId);

  const file = new File([Uint8Array.from(input.buffer)], input.filename, {
    type: 'application/pdf',
  });

  const uploaded = await uploadFile({
    file,
    module: MODULE,
    entityType: 'session',
    entityId: input.sessionId,
    category: input.storageCategory,
    visibility: 'internal',
  });

  return prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category: input.category,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: 'INTERNAL',
      provider: 's3',
      createdById: input.createdById,
      metadata: {
        sessionId: input.sessionId,
        dayId: input.dayId,
        dayDate: input.dayDateIso,
        slot: input.slot,
        storageCategory: input.storageCategory,
      },
    },
  });
}

export async function storeEmargementPdfForSlot(input: {
  sessionId: string;
  dayId: string;
  dayDateIso: string;
  slot: FormationSessionDaySlot;
  buffer: Buffer;
  createdById: string;
}) {
  const slotLabel = input.slot === 'MORNING' ? 'matin' : 'soir';
  const filename = buildEmargementPdfFilename({
    sessionId: input.sessionId,
    date: parseIsoDateOnly(input.dayDateIso),
    slot: slotLabel,
  });

  return storeSessionSuiviPdfAsset({
    ...input,
    filename,
    category: EMARGEMENT_PDF_CATEGORY[input.slot],
    storageCategory: STORAGE_CATEGORY[input.slot],
  });
}

export type SessionDocumentRow = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  category: string;
  categoryLabel: string;
  dayDate: string | null;
  slot: FormationSessionDaySlot | null;
  createdAt: string;
  createdByName: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  'emargement-pdf-morning': 'Émargement PDF — matin',
  'emargement-pdf-evening': 'Émargement PDF — soir',
  'attendance-pdf-blank': 'Feuille de présence générée',
  'attendance-scan': 'Feuille scannée',
  emargement: 'Émargement',
  'suivi-quotidien': 'Suivi quotidien',
  conformite: 'Conformité financeur',
  'conformite-export-cpf': 'Export CSV — CPF',
  'conformite-export-france-travail': 'Export CSV — France Travail',
  'conformite-export-all': 'Export CSV — conformité complet',
  'upload-general': 'Document uploadé',
  'upload-emargement': 'Scan émargement uploadé',
  'upload-suivi-quotidien': 'Document suivi uploadé',
  'upload-conformite': 'Pièce conformité uploadée',
  'upload-archives': 'Archive uploadée',
  archives: 'Archives légales',
  general: 'Document général',
};

function parseMetadata(value: unknown): {
  dayDate: string | null;
  slot: FormationSessionDaySlot | null;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { dayDate: null, slot: null };
  }
  const meta = value as Record<string, unknown>;
  const dayDate = typeof meta.dayDate === 'string' ? meta.dayDate : null;
  const slotRaw = meta.slot;
  const slot =
    slotRaw === 'MORNING' || slotRaw === 'EVENING'
      ? slotRaw
      : slotRaw === 'matin'
        ? 'MORNING'
        : slotRaw === 'soir'
          ? 'EVENING'
          : null;
  return { dayDate, slot };
}

export async function listSessionSuiviDocuments(sessionId: string): Promise<SessionDocumentRow[]> {
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
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

  return rows.map((r) => {
    const { dayDate, slot } = parseMetadata(r.metadata);
    const category = r.category ?? 'general';
    return {
      id: r.id,
      originalName: r.originalName,
      url: r.url,
      mimeType: r.mimeType,
      size: r.size,
      category,
      categoryLabel: CATEGORY_LABELS[category] ?? category,
      dayDate,
      slot,
      createdAt: r.createdAt.toISOString(),
      createdByName: r.createdBy?.name ?? null,
    };
  });
}

export async function storeConformiteExportCsv(input: {
  sessionId: string;
  variant: 'cpf' | 'france-travail' | 'all';
  buffer: Buffer;
  filename: string;
  createdById: string;
  rowCount: number;
}) {
  await ensureSessionSuiviStoragePrefixes(input.sessionId);

  const category =
    input.variant === 'cpf'
      ? 'conformite-export-cpf'
      : input.variant === 'france-travail'
        ? 'conformite-export-france-travail'
        : 'conformite-export-all';

  const file = new File([Uint8Array.from(input.buffer)], input.filename, {
    type: 'text/csv;charset=utf-8',
  });

  const uploaded = await uploadFile({
    file,
    module: MODULE,
    entityType: 'session',
    entityId: input.sessionId,
    category: 'conformite',
    visibility: 'internal',
  });

  return prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category,
      originalName: uploaded.originalName,
      mimeType: 'text/csv',
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: 'INTERNAL',
      provider: 's3',
      createdById: input.createdById,
      metadata: {
        sessionId: input.sessionId,
        exportVariant: input.variant,
        rowCount: input.rowCount,
        kind: 'conformite-export',
      },
    },
  });
}

const UPLOAD_CATEGORIES = ['general', 'emargement', 'suivi-quotidien', 'conformite', 'archives'] as const;
export type SuiviUploadCategory = (typeof UPLOAD_CATEGORIES)[number];

export function isSuiviUploadCategory(value: string): value is SuiviUploadCategory {
  return (UPLOAD_CATEGORIES as readonly string[]).includes(value);
}

export async function storeSessionDocumentUpload(input: {
  sessionId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  category: SuiviUploadCategory;
  createdById: string;
  dayDate?: string | null;
}) {
  await ensureSessionSuiviStoragePrefixes(input.sessionId);

  const file = new File([Uint8Array.from(input.buffer)], input.filename, {
    type: input.mimeType,
  });

  const uploaded = await uploadFile({
    file,
    module: MODULE,
    entityType: 'session',
    entityId: input.sessionId,
    category: input.category,
    visibility: input.category === 'archives' ? 'private' : 'internal',
  });

  const assetCategory =
    input.category === 'emargement' ? 'attendance-scan' : `upload-${input.category}`;

  return prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category: assetCategory,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: input.category === 'archives' ? 'PRIVATE' : 'INTERNAL',
      provider: 's3',
      createdById: input.createdById,
      metadata: {
        sessionId: input.sessionId,
        storageCategory: input.category,
        dayDate: input.dayDate ?? null,
        kind: 'upload',
      },
    },
  });
}
