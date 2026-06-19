import { apiFetch } from '@/lib/api';
import type { FileAssetMetaInput } from '@/components/governance/file-asset-meta-sheet';

export const RH_DOCUMENT_FORM_FIELDS = [
  'documentCni',
  'documentAssurance',
  'documentResidencePermit',
  'documentCartePro',
] as const;

export type RhDocumentFormField = (typeof RH_DOCUMENT_FORM_FIELDS)[number];

export const RH_DOCUMENT_FIELD_TO_CATEGORY: Record<RhDocumentFormField, string> = {
  documentCni: 'document_cni',
  documentAssurance: 'document_assurance',
  documentResidencePermit: 'document_residence_permit',
  documentCartePro: 'document_carte_pro',
};

/** Libellés métier alignés sur le formulaire collaborateur. */
export const RH_DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  document_cni: 'CNI / Passeport',
  document_assurance: 'Attestation Assurance',
  document_residence_permit: 'Titre de Séjour',
  document_carte_pro: 'Justificatif habilitation / agrément',
};

type FileAssetListItem = {
  id: string;
  category: string | null;
  originalName: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  issuedBy?: string | null;
  documentRef?: string | null;
};

function toMetaInput(asset: FileAssetListItem): FileAssetMetaInput {
  return {
    fileAssetId: asset.id,
    fileName: asset.originalName,
    label: asset.category ? RH_DOCUMENT_CATEGORY_LABELS[asset.category] : undefined,
    issuedAt: asset.issuedAt ?? null,
    expiresAt: asset.expiresAt ?? null,
    issuedBy: asset.issuedBy ?? null,
    documentRef: asset.documentRef ?? null,
  };
}

/** Champs document réellement uploadés dans le PATCH collaborateur. */
export function collectUploadedRhDocumentCategories(
  values: Record<string, unknown>,
): string[] {
  return RH_DOCUMENT_FORM_FIELDS.filter((field) => {
    const value = values[field];
    return value instanceof File && value.size > 0;
  }).map((field) => RH_DOCUMENT_FIELD_TO_CATEGORY[field]);
}

/**
 * Résout les FileAssets les plus récents (par catégorie demandée) après un PATCH.
 * Retourne les assets dans le même ordre que `categories`.
 */
export async function resolveRhFileAssetsForMeta(
  entityId: string,
  categories: string[],
): Promise<FileAssetMetaInput[]> {
  if (!categories.length) return [];

  const params = new URLSearchParams({
    module: 'crm',
    entityType: 'collaborateur',
    entityId,
  });

  const response = await apiFetch(`/api/common/files?${params.toString()}`);
  if (!response.ok) return [];

  const json = (await response.json()) as { data?: FileAssetListItem[] };
  const items = json.data ?? [];

  // API retourne par createdAt desc → le premier trouvé par catégorie est le plus récent
  const latestByCategory = new Map<string, FileAssetListItem>();
  for (const item of items) {
    if (!item.category || !categories.includes(item.category)) continue;
    if (!latestByCategory.has(item.category)) {
      latestByCategory.set(item.category, item);
    }
  }

  return categories
    .map((category) => latestByCategory.get(category))
    .filter((item): item is FileAssetListItem => Boolean(item))
    .map(toMetaInput);
}
