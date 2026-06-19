import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export type DemandeDocumentRow = {
  id: string;
  dossierKind: string;
  dossierKindLabel: string;
  subjectType: string;
  subjectTypeLabel: string;
  subjectId: string;
  personName: string;
  email: string;
  contextLabel: string;
  missingPieces: string[];
  missingCount: number;
  requestedCount: number;
  completenessPct: number;
  dossierStatus: string;
  updatedAt: string;
  gedPath: string;
  editPath: string | null;
  crmPath: string | null;
  userId: string | null;
  candidatureId: string | null;
};

export type DemandesDocumentsResponse = {
  stats: {
    total: number;
    missingItems: number;
    openRequests: number;
    requestedItems: number;
    profiles: number;
  };
  items: DemandeDocumentRow[];
  pagination: { page: number; limit: number; total: number };
};

export async function fetchDemandesDocuments(params: {
  q?: string;
  page: number;
  limit: number;
  evaluate?: boolean;
}): Promise<DemandesDocumentsResponse> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.q?.trim()) sp.set('q', params.q.trim());
  if (params.evaluate) sp.set('evaluate', '1');

  const res = await apiFetch(
    `/api/sections/securite-configuration/gouvernance-donnees/demandes?${sp}`,
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ??
        'Impossible de charger les demandes documentaires.',
    );
  }
  return unwrapSectionApiData<DemandesDocumentsResponse>(json)!;
}

export async function notifyDossierByEmail(input: {
  dossierId: string;
  message?: string;
}): Promise<{
  emailSent: boolean;
  recipientEmail: string;
  recipientName: string;
  piecesCount: number;
  pieceLabels: string[];
  emailError: string | null;
}> {
  const res = await apiFetch(
    `/api/sections/securite-configuration/gouvernance-donnees/compliance/dossiers/${input.dossierId}/notify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.message }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ??
        'Impossible d’envoyer l’e-mail.',
    );
  }
  return unwrapSectionApiData(json)!;
}
