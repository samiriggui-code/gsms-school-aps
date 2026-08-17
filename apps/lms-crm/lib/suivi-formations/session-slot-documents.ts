import { prisma } from '@/lib/prisma';
import type { FormationSessionDaySlot } from '@repo/database';

const MODULE = 'gestion-academique';
const ENTITY_TYPE = 'formation_session';

const EMARGEMENT_PDF_CATEGORY: Record<FormationSessionDaySlot, string> = {
  MORNING: 'emargement-pdf-morning',
  EVENING: 'emargement-pdf-evening',
};

export type SessionSlotDocumentRole = 'template-pdf' | 'signed-scan';

function readMeta(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function metadataMatchesDaySlot(
  metadata: unknown,
  dayId: string,
  slot: FormationSessionDaySlot,
): boolean {
  const meta = readMeta(metadata);
  return meta.dayId === dayId && meta.slot === slot;
}

/** PDF modèle actif pour un créneau (un seul ACTIVE à la fois). */
export async function findActiveSlotTemplateAsset(
  sessionId: string,
  dayId: string,
  slot: FormationSessionDaySlot,
) {
  const category = EMARGEMENT_PDF_CATEGORY[slot];
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      category,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.find((r) => metadataMatchesDaySlot(r.metadata, dayId, slot)) ?? null;
}

/** Archive les modèles PDF précédents du même créneau (conservation audit, pas de suppression). */
export async function archivePreviousSlotTemplates(input: {
  sessionId: string;
  dayId: string;
  slot: FormationSessionDaySlot;
  reason: string;
  supersededById?: string;
}) {
  const category = EMARGEMENT_PDF_CATEGORY[input.slot];
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category,
      status: 'ACTIVE',
    },
  });

  const toArchive = rows.filter((r) => metadataMatchesDaySlot(r.metadata, input.dayId, input.slot));
  if (toArchive.length === 0) return 0;

  const now = new Date();
  await prisma.$transaction(
    toArchive.map((asset) => {
      const meta = readMeta(asset.metadata);
      return prisma.fileAsset.update({
        where: { id: asset.id },
        data: {
          status: 'ARCHIVED',
          archivedAt: now,
          archiveReason: input.reason,
          metadata: {
            ...meta,
            slotRole: 'template-pdf',
            supersededAt: now.toISOString(),
            supersededById: input.supersededById ?? null,
          },
        },
      });
    }),
  );
  return toArchive.length;
}

export async function countSignedScansForSlot(
  sessionId: string,
  dayId: string,
  slot: FormationSessionDaySlot,
): Promise<number> {
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      category: { in: ['attendance-scan', 'upload-emargement'] },
      status: { in: ['ACTIVE', 'ARCHIVED'] },
    },
    select: { metadata: true },
  });
  return rows.filter((r) => metadataMatchesDaySlot(r.metadata, dayId, slot)).length;
}

export type SlotDocumentsInfo = {
  templatePdf: { id: string; url: string; originalName: string } | null;
  archivedTemplateCount: number;
  signedScanCount: number;
  signedScans: Array<{
    id: string;
    url: string;
    originalName: string;
    scanIndex: number | null;
  }>;
};

export type DaySlotDocumentCounts = {
  hasTemplate: boolean;
  scanCount: number;
  archivedTemplates: number;
};

type AssetRow = {
  id: string;
  url: string;
  originalName: string;
  category: string | null;
  status: string;
  metadata: unknown;
};

const SCAN_CATEGORIES = ['attendance-scan', 'upload-emargement'] as const;
const TEMPLATE_CATEGORIES = ['emargement-pdf-morning', 'emargement-pdf-evening'] as const;

async function loadSessionSlotAssetRows(sessionId: string): Promise<AssetRow[]> {
  return prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      category: { in: [...TEMPLATE_CATEGORIES, ...SCAN_CATEGORIES] },
      status: { in: ['ACTIVE', 'ARCHIVED'] },
    },
    select: {
      id: true,
      url: true,
      originalName: true,
      category: true,
      status: true,
      metadata: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

function buildSlotDocumentsInfo(rows: AssetRow[], dayId: string, slot: FormationSessionDaySlot): SlotDocumentsInfo {
  const daySlotRows = rows.filter((r) => metadataMatchesDaySlot(r.metadata, dayId, slot));
  const templateCategory = EMARGEMENT_PDF_CATEGORY[slot];
  const templates = daySlotRows.filter((r) => r.category === templateCategory);
  const activeTemplate = templates.find((r) => r.status === 'ACTIVE') ?? null;
  const scans = daySlotRows.filter((r) =>
    SCAN_CATEGORIES.includes(r.category as (typeof SCAN_CATEGORIES)[number]),
  );

  return {
    templatePdf: activeTemplate
      ? {
          id: activeTemplate.id,
          url: activeTemplate.url,
          originalName: activeTemplate.originalName,
        }
      : null,
    archivedTemplateCount: templates.filter((r) => r.status === 'ARCHIVED').length,
    signedScanCount: scans.length,
    signedScans: scans.map((s) => {
      const meta = readMeta(s.metadata);
      return {
        id: s.id,
        url: s.url,
        originalName: s.originalName,
        scanIndex: typeof meta.scanIndex === 'number' ? meta.scanIndex : null,
      };
    }),
  };
}

/** Résumé documents (modèle PDF + scans) pour les deux créneaux d'un jour. */
export async function summarizeSlotDocumentsForDay(
  sessionId: string,
  dayId: string,
): Promise<Record<FormationSessionDaySlot, SlotDocumentsInfo>> {
  const rows = await loadSessionSlotAssetRows(sessionId);
  return {
    MORNING: buildSlotDocumentsInfo(rows, dayId, 'MORNING'),
    EVENING: buildSlotDocumentsInfo(rows, dayId, 'EVENING'),
  };
}

/** Compteurs légers pour la liste journal (tous les jours en une requête). */
export async function buildDaySlotDocumentCountsMap(
  sessionId: string,
  dayIds: string[],
): Promise<Map<string, Record<FormationSessionDaySlot, DaySlotDocumentCounts>>> {
  const result = new Map<string, Record<FormationSessionDaySlot, DaySlotDocumentCounts>>();
  if (dayIds.length === 0) return result;

  const rows = await loadSessionSlotAssetRows(sessionId);

  for (const dayId of dayIds) {
    const morning = buildSlotDocumentsInfo(rows, dayId, 'MORNING');
    const evening = buildSlotDocumentsInfo(rows, dayId, 'EVENING');
    result.set(dayId, {
      MORNING: {
        hasTemplate: Boolean(morning.templatePdf),
        scanCount: morning.signedScanCount,
        archivedTemplates: morning.archivedTemplateCount,
      },
      EVENING: {
        hasTemplate: Boolean(evening.templatePdf),
        scanCount: evening.signedScanCount,
        archivedTemplates: evening.archivedTemplateCount,
      },
    });
  }
  return result;
}
