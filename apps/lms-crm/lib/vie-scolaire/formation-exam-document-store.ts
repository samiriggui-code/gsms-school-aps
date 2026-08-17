import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import { ensureSessionSuiviStoragePrefixes } from '@/lib/entity-storage';
import {
  EXAM_PDF_CATEGORY_BY_TYPE,
  EXAM_PDF_CATEGORY_LABELS,
} from '@/lib/vie-scolaire/formation-exam-convocation-content';
import type { FormationExamOfficialDocType } from '@/lib/vie-scolaire/formation-exam-documents';

const MODULE = 'gestion-academique';
const ENTITY_TYPE = 'formation_session';

function readMeta(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function metadataMatchesExamDoc(metadata: unknown, examId: string, docType: FormationExamOfficialDocType) {
  const meta = readMeta(metadata);
  return meta.examId === examId && meta.examDocType === docType;
}

/** Archive les versions PDF précédentes du même type pour cet examen (audit, pas de suppression). */
export async function archivePreviousExamPdfTemplates(input: {
  sessionId: string;
  examId: string;
  docType: FormationExamOfficialDocType;
  reason: string;
  supersededById?: string;
}) {
  const category = EXAM_PDF_CATEGORY_BY_TYPE[input.docType];
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category,
      status: 'ACTIVE',
    },
  });

  const toArchive = rows.filter((r) => metadataMatchesExamDoc(r.metadata, input.examId, input.docType));
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
            supersededAt: now.toISOString(),
            supersededById: input.supersededById ?? null,
          },
        },
      });
    }),
  );
  return toArchive.length;
}

export async function storeFormationExamPdfAsset(input: {
  examId: string;
  sessionId: string;
  docType: FormationExamOfficialDocType;
  buffer: Buffer;
  filename: string;
  createdById: string;
  participantCount?: number;
}) {
  await ensureSessionSuiviStoragePrefixes(input.sessionId);

  await archivePreviousExamPdfTemplates({
    sessionId: input.sessionId,
    examId: input.examId,
    docType: input.docType,
    reason: 'Nouvelle génération PDF examen — version précédente archivée',
  });

  const category = EXAM_PDF_CATEGORY_BY_TYPE[input.docType];
  const file = new File([Uint8Array.from(input.buffer)], input.filename, {
    type: 'application/pdf',
  });

  const uploaded = await uploadFile({
    file,
    module: MODULE,
    entityType: 'session',
    entityId: input.sessionId,
    category: 'examen',
    visibility: 'internal',
  });

  const asset = await prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category,
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
        examId: input.examId,
        examDocType: input.docType,
        storageCategory: 'examen',
        slotRole: 'template-pdf',
        documentKind: 'formation-exam-official',
        title: EXAM_PDF_CATEGORY_LABELS[category] ?? category,
        participantCount: input.participantCount ?? null,
        generatedAt: new Date().toISOString(),
      },
    },
  });

  return asset;
}

export type ExamArchivedDocumentRow = {
  docType: FormationExamOfficialDocType;
  fileAssetId: string;
  url: string;
  originalName: string;
  size: number;
  createdAt: string;
  createdByName: string | null;
};

/** Dernière version ACTIVE par type de document pour un examen. */
export async function listLatestExamArchivedDocuments(
  sessionId: string,
  examId: string,
): Promise<ExamArchivedDocumentRow[]> {
  const categories = Object.values(EXAM_PDF_CATEGORY_BY_TYPE);
  const rows = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      category: { in: categories },
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      url: true,
      originalName: true,
      size: true,
      metadata: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  const byType = new Map<FormationExamOfficialDocType, ExamArchivedDocumentRow>();

  for (const row of rows) {
    const meta = readMeta(row.metadata);
    if (meta.examId !== examId) continue;
    const docType = meta.examDocType as FormationExamOfficialDocType;
    if (!docType || byType.has(docType)) continue;

    byType.set(docType, {
      docType,
      fileAssetId: row.id,
      url: row.url,
      originalName: row.originalName,
      size: row.size,
      createdAt: row.createdAt.toISOString(),
      createdByName: row.createdBy?.name ?? null,
    });
  }

  return Array.from(byType.values());
}
