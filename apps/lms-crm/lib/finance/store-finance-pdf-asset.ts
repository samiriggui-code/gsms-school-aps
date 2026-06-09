import { prisma } from '@/lib/prisma';
import { deleteFileByKey, resolveKeyFromUrl, uploadFile } from '@repo/storage';
import type { FinancePdfCategory } from './finance-devis-types';

const MODULE = 'administration-facturation';
const ENTITY_TYPE = 'finance_devis';

export async function getStoredFinancePdf(devisId: string, category: FinancePdfCategory) {
  return prisma.fileAsset.findFirst({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: devisId,
      category,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function retireStoredPdf(asset: { id: string; storageKey: string; url: string }) {
  const key = asset.storageKey || resolveKeyFromUrl(asset.url) || '';
  if (key) {
    await deleteFileByKey(key).catch(() => undefined);
  }
  await prisma.fileAsset.update({
    where: { id: asset.id },
    data: { status: 'DELETED', deletedAt: new Date() },
  });
}

export async function storeFinancePdfAsset(input: {
  devisId: string;
  category: FinancePdfCategory;
  buffer: Buffer;
  filename: string;
  createdById: string;
}) {
  const existing = await getStoredFinancePdf(input.devisId, input.category);
  if (existing) {
    await retireStoredPdf(existing);
  }

  const file = new File([Uint8Array.from(input.buffer)], input.filename, {
    type: 'application/pdf',
  });
  const uploaded = await uploadFile({
    file,
    module: MODULE,
    entityType: ENTITY_TYPE,
    entityId: input.devisId,
    category: input.category,
    visibility: 'internal',
  });

  return prisma.fileAsset.create({
    data: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.devisId,
      category: input.category,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: 'INTERNAL',
      provider: 's3',
      createdById: input.createdById,
      metadata: { generatedAt: new Date().toISOString() },
    },
  });
}
