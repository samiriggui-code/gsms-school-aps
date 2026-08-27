import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import { ensureSessionSuiviStoragePrefixes } from '@/lib/entity-storage';
import { SESSION_PDF_CATEGORY } from '@/lib/vie-scolaire/session-convocation-content';

const MODULE = 'gestion-academique';
const ENTITY_TYPE = 'formation_session';

/** Archive le PDF de convocations généré pour une session en tant que FileAsset (interne). */
export async function storeSessionConvocationPdfAsset(input: {
  sessionId: string;
  buffer: Buffer;
  filename: string;
  createdById: string;
  participantCount: number;
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
    category: 'convocation',
    visibility: 'internal',
  });

  return prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      category: SESSION_PDF_CATEGORY.convocation,
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
        participantCount: input.participantCount,
      },
    },
  });
}
