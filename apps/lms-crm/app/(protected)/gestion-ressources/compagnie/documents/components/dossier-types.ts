import type { AdminDocumentSlot, AdministrativeDossierHistoryEntry } from '@/lib/admin-document-slots';

export type DossierActor = {
  id: string;
  name: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  status: string | null;
};

export type DossierFileSummary = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  createdAt: string;
  createdBy: DossierActor | null;
} | null;

export type DossierHistoryEntry = AdministrativeDossierHistoryEntry & {
  actor: DossierActor | null;
};

export type DossierSlotPayload = {
  definition: AdminDocumentSlot;
  fiche: {
    reference: string;
    issuedAt: string | null;
    expiresAt: string | null;
    notes: string;
    fileAssetId: string | null;
  };
  file: DossierFileSummary;
  lastActor: DossierActor | null;
  lastUpdatedAt: string | null;
  history: DossierHistoryEntry[];
};

export type DossierAdministratifResponse = {
  settingsId: string;
  slots: DossierSlotPayload[];
  summary: {
    totalSlots: number;
    withFile: number;
    expiringSoon: number;
    expired: number;
  };
};
