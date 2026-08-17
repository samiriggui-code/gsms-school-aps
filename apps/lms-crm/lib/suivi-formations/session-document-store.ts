import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import type { SessionDocumentStorageCategory } from '@repo/storage/constants';
import { buildEmargementPdfFilename } from '@/lib/formation-session-document-storage';
import { ensureSessionSuiviStoragePrefixes } from '@/lib/entity-storage';
import type { FormationSessionDaySlot } from '@repo/database';
import { parseIsoDateOnly } from '@/lib/suivi-formations/session-days';
import {
  type SessionDocumentUploadMetadata,
  type SuiviDocumentKind,
  type SuiviUploadCategory,
  SUIVI_DOCUMENT_KIND_LABELS,
  isSuiviUploadCategory,
} from '@/lib/suivi-formations/session-upload-metadata';
import {
  archivePreviousSlotTemplates,
  countSignedScansForSlot,
} from '@/lib/suivi-formations/session-slot-documents';

export { isSuiviUploadCategory, type SuiviUploadCategory };

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
        slotRole: 'template-pdf',
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
  await archivePreviousSlotTemplates({
    sessionId: input.sessionId,
    dayId: input.dayId,
    slot: input.slot,
    reason: 'Nouvelle génération PDF modèle — version précédente conservée en archive',
  });

  const slotLabel = input.slot === 'MORNING' ? 'matin' : 'soir';
  const filename = buildEmargementPdfFilename({
    sessionId: input.sessionId,
    date: parseIsoDateOnly(input.dayDateIso),
    slot: slotLabel,
  });

  const asset = await storeSessionSuiviPdfAsset({
    ...input,
    filename,
    category: EMARGEMENT_PDF_CATEGORY[input.slot],
    storageCategory: STORAGE_CATEGORY[input.slot],
  });

  return asset;
}

export type SessionDocumentRow = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  category: string;
  categoryLabel: string;
  title: string | null;
  documentKind: SuiviDocumentKind | null;
  documentKindLabel: string | null;
  notes: string | null;
  dayDate: string | null;
  slot: FormationSessionDaySlot | null;
  slotRole: 'template-pdf' | 'signed-scan' | null;
  scanIndex: number | null;
  legalHold: boolean;
  createdAt: string;
  createdByName: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  'emargement-pdf-morning': 'Émargement PDF — matin',
  'emargement-pdf-evening': 'Émargement PDF — après-midi',
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
  'upload-examen': 'Document examen uploadé',
  'upload-archives': 'Archive uploadée',
  archives: 'Archives légales',
  general: 'Document général',
  'session-dossier-closure': 'Clôture dossier session',
  'exam-pdf-candidats': 'Examen — liste nominative candidats',
  'exam-pdf-emargement': 'Examen — feuille d\'émargement',
  'exam-pdf-convocation': 'Examen — convocations individuelles',
  'exam-pdf-jury': 'Examen — fiche jury & délibération',
};

function parseMetadata(value: unknown): {
  dayDate: string | null;
  slot: FormationSessionDaySlot | null;
  title: string | null;
  documentKind: SuiviDocumentKind | null;
  notes: string | null;
  legalHold: boolean;
  slotRole: 'template-pdf' | 'signed-scan' | null;
  scanIndex: number | null;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      dayDate: null,
      slot: null,
      title: null,
      documentKind: null,
      notes: null,
      legalHold: false,
      slotRole: null,
      scanIndex: null,
    };
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
  const title = typeof meta.title === 'string' ? meta.title : null;
  const notes = typeof meta.notes === 'string' ? meta.notes : null;
  const documentKindRaw = meta.documentKind;
  const documentKind =
    typeof documentKindRaw === 'string' && documentKindRaw in SUIVI_DOCUMENT_KIND_LABELS
      ? (documentKindRaw as SuiviDocumentKind)
      : null;
  const legalHold = meta.legalHold === true;
  const slotRoleRaw = meta.slotRole;
  const slotRole =
    slotRoleRaw === 'template-pdf' || slotRoleRaw === 'signed-scan' ? slotRoleRaw : null;
  const scanIndex = typeof meta.scanIndex === 'number' ? meta.scanIndex : null;
  return { dayDate, slot, title, documentKind, notes, legalHold, slotRole, scanIndex };
}

export async function listSessionSuiviDocuments(sessionId: string): Promise<SessionDocumentRow[]> {
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      status: { in: ['ACTIVE', 'ARCHIVED'] },
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
      legalHold: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  return rows.map((r) => {
    const {
      dayDate,
      slot,
      title,
      documentKind,
      notes,
      legalHold: metaLegalHold,
      slotRole,
      scanIndex,
    } = parseMetadata(r.metadata);
    const category = r.category ?? 'general';
    const inferredRole =
      slotRole ??
      (category === 'emargement-pdf-morning' || category === 'emargement-pdf-evening'
        ? 'template-pdf'
        : category === 'attendance-scan' || category === 'upload-emargement'
          ? 'signed-scan'
          : null);
    return {
      id: r.id,
      originalName: r.originalName,
      url: r.url,
      mimeType: r.mimeType,
      size: r.size,
      category,
      categoryLabel: CATEGORY_LABELS[category] ?? category,
      title,
      documentKind,
      documentKindLabel: documentKind ? SUIVI_DOCUMENT_KIND_LABELS[documentKind] : null,
      notes,
      dayDate,
      slot,
      slotRole: inferredRole,
      scanIndex,
      legalHold: r.legalHold || metaLegalHold,
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

const UPLOAD_CATEGORIES = ['general', 'emargement', 'suivi-quotidien', 'conformite', 'examen', 'archives'] as const;

export async function storeSessionDocumentUpload(input: {
  sessionId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  category: SuiviUploadCategory;
  createdById: string;
  dayId?: string | null;
  dayDate?: string | null;
  slot?: FormationSessionDaySlot | null;
  documentKind?: SuiviDocumentKind;
  title?: string | null;
  notes?: string | null;
  legalHold?: boolean;
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

  const documentKind = input.documentKind ?? 'other';
  const title =
    input.title?.trim() ||
    (documentKind in SUIVI_DOCUMENT_KIND_LABELS
      ? SUIVI_DOCUMENT_KIND_LABELS[documentKind as SuiviDocumentKind]
      : input.filename);

  let scanIndex: number | null = null;
  if (input.category === 'emargement' && input.dayId && input.slot) {
    scanIndex = (await countSignedScansForSlot(input.sessionId, input.dayId, input.slot)) + 1;
  }

  const metadata: SessionDocumentUploadMetadata = {
    sessionId: input.sessionId,
    storageCategory: input.category,
    documentKind,
    title,
    notes: input.notes?.trim() || null,
    dayId: input.dayId ?? null,
    dayDate: input.dayDate ?? null,
    slot: input.slot ?? null,
    kind: 'upload',
    source: 'manual-deposit',
    legalHold: input.legalHold === true,
    slotRole: input.category === 'emargement' ? 'signed-scan' : undefined,
    scanIndex: scanIndex ?? undefined,
  };

  const legalHold = input.legalHold === true || input.category === 'archives';

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
      legalHold,
      metadata,
    },
  });
}
