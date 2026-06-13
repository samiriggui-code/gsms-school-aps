import { CNAPS_DOSSIER_SLOTS, type CnapsDossierSlotDef } from '@/app/(protected)/gestion-academique/vie-scolaire/etudiants/lib/cnaps-dossier-documents';

export const PORTAL_CNAPS_MODULE = 'portal-candidat';

export type CnapsFileRow = {
  id: string;
  name: string;
  url: string | null;
  mimeType: string;
  uploadedAt: string;
  verified: boolean;
  verifiedAt: string | null;
};

export type CnapsPortalSlot = CnapsDossierSlotDef & {
  uploaded: boolean;
  verified: boolean;
  files: CnapsFileRow[];
};

export type CnapsResendRequest = {
  requestedAt: string;
  reason: string;
  note: string | null;
  status: 'PENDING' | 'PROCESSED';
};

export function parseFileSchoolVerified(metadata: unknown): {
  verified: boolean;
  verifiedAt: string | null;
} {
  if (metadata == null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { verified: false, verifiedAt: null };
  }
  const m = metadata as Record<string, unknown>;
  const verified = m.schoolVerified === true;
  const verifiedAt = typeof m.verifiedAt === 'string' ? m.verifiedAt : null;
  return { verified, verifiedAt };
}

type FileAssetLike = {
  id: string;
  category: string | null;
  originalName: string;
  url: string;
  mimeType: string;
  createdAt: Date;
  metadata: unknown;
};

export function buildCnapsPortalSlots(files: FileAssetLike[]): CnapsPortalSlot[] {
  return CNAPS_DOSSIER_SLOTS.map((slot) => {
    const slotFiles = files
      .filter((f) => (f.category || '').toUpperCase().startsWith(slot.category.toUpperCase()))
      .map((f) => {
        const v = parseFileSchoolVerified(f.metadata);
        return {
          id: f.id,
          name: f.originalName,
          url: f.url,
          mimeType: f.mimeType,
          uploadedAt: f.createdAt.toISOString(),
          verified: v.verified,
          verifiedAt: v.verifiedAt,
        };
      });

    const verified = slotFiles.length > 0 && slotFiles.every((f) => f.verified);

    return {
      ...slot,
      uploaded: slotFiles.length > 0,
      verified,
      files: slotFiles,
    };
  });
}

export function isCnapsDossierComplete(slots: CnapsPortalSlot[]): boolean {
  return slots.every((s) => s.uploaded);
}

export function isCnapsDossierFullyVerified(slots: CnapsPortalSlot[]): boolean {
  return slots.every((s) => s.uploaded && s.verified);
}

export function getCnapsAuthorizationFile(
  slots: CnapsPortalSlot[],
): CnapsFileRow | null {
  const slot = slots.find((s) => s.category === 'CNAPS_AUTHORIZATION');
  if (!slot?.files.length) return null;
  const verified = slot.files.filter((f) => f.verified);
  return verified[0] ?? null;
}

export function getCnapsSchoolFormFile(slots: CnapsPortalSlot[]): CnapsFileRow | null {
  const slot = slots.find((s) => s.category === 'CNAPS_FORM_OF');
  if (!slot?.files.length) return null;
  const verified = slot.files.filter((f) => f.verified);
  return verified[0] ?? slot.files[0] ?? null;
}

export function candidateUploadableCategories(): string[] {
  return CNAPS_DOSSIER_SLOTS.filter((s) => s.uploadBy !== 'school').map((s) => s.category);
}

export function parseCnapsResendRequests(metadata: unknown): CnapsResendRequest[] {
  if (metadata == null || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
  const raw = (metadata as Record<string, unknown>).cnapsResendRequests;
  if (!Array.isArray(raw)) return [];
  const out: CnapsResendRequest[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const requestedAt = typeof o.requestedAt === 'string' ? o.requestedAt : null;
    const reason = typeof o.reason === 'string' ? o.reason : null;
    if (!requestedAt || !reason) continue;
    out.push({
      requestedAt,
      reason,
      note: typeof o.note === 'string' ? o.note : null,
      status: o.status === 'PROCESSED' ? 'PROCESSED' : 'PENDING',
    });
  }
  return out;
}

export const CNAPS_RESEND_REASON_LABELS: Record<string, string> = {
  LOST_MAIL: 'Courrier perdu ou non reçu',
  NOT_DOWNLOADABLE: 'Autorisation non téléchargeable',
  OTHER: 'Autre motif',
};
