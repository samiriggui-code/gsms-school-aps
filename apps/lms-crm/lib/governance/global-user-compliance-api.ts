import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type {
  RhComplianceStatsSummary,
  RhComplianceStatus,
} from '@/lib/gestion-ressources/rh-conformite-compliance';import type { CollaborateurComplianceResponse } from '@/lib/gestion-ressources/collaborateur-compliance-api';
export type GlobalComplianceUserRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: string;
  roleName: string;
  roleSlug: string | null;
  userCategory: string | null;
  complianceStatus: RhComplianceStatus;
  complianceIssueCount: number;
  canBeAssigned: boolean;
  profilePath: string;
  gedPath: string;
};

export type GlobalComplianceListResponse = {
  data: GlobalComplianceUserRow[];
  pagination: { page: number; limit: number; total: number };
};

export type GlobalComplianceDetail = CollaborateurComplianceResponse & {
  user: {
    id: string;
    name: string;
    email: string;
    proEmail: string | null;
    userCategory: string | null;
    jobFunction: string | null;
    roleName: string | null;
    roleSlug: string | null;
    profilePath: string;
    gedPath: string;
  };
  nonCompliantRows: CollaborateurComplianceResponse['rows'];
  dossiers: {
    id: string;
    kind: string;
    status: string;
    items: { id: string; label: string; status: string }[];
  }[];
};

export type GlobalComplianceNotifyResponse = {
  emailSent: boolean;
  emailError: string | null;
  recipientEmail: string;
  recipientName: string;
  piecesCount: number;
  pieceLabels: string[];
};

export async function fetchGlobalComplianceStats(): Promise<RhComplianceStatsSummary> {
  const res = await apiFetch(
    '/api/sections/securite-configuration/gouvernance-donnees/compliance/users/stats',
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ??
        'Impossible de charger les statistiques.',
    );
  }
  return unwrapSectionApiData<RhComplianceStatsSummary>(json)!;
}

export async function fetchGlobalComplianceUsers(params: {
  page: number;
  limit: number;
  q?: string;
  complianceStatus?: RhComplianceStatus | 'all';
  hasIssues?: boolean;
  roleSlug?: string;
  userCategory?: string;
}): Promise<GlobalComplianceListResponse> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.q?.trim()) sp.set('q', params.q.trim());
  if (params.hasIssues) sp.set('hasIssues', '1');
  else if (params.complianceStatus && params.complianceStatus !== 'all') {
    sp.set('complianceStatus', params.complianceStatus);
  }
  if (params.roleSlug) sp.set('roleSlug', params.roleSlug);
  if (params.userCategory) sp.set('userCategory', params.userCategory);

  const res = await apiFetch(
    `/api/sections/securite-configuration/gouvernance-donnees/compliance/users?${sp}`,
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ??
        'Impossible de charger la conformité.',
    );
  }
  return unwrapSectionApiData<GlobalComplianceListResponse>(json)!;
}

export async function fetchGlobalComplianceUserDetail(
  userId: string,
): Promise<GlobalComplianceDetail> {
  const res = await apiFetch(
    `/api/sections/securite-configuration/gouvernance-donnees/compliance/users/${userId}`,
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ??
        'Impossible de charger le détail.',
    );
  }
  return unwrapSectionApiData<GlobalComplianceDetail>(json)!;
}

export async function notifyGlobalComplianceUser(input: {
  userId: string;
  message?: string;
}): Promise<GlobalComplianceNotifyResponse> {
  const res = await apiFetch(
    `/api/sections/securite-configuration/gouvernance-donnees/compliance/users/${input.userId}/notify`,
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
  return unwrapSectionApiData<GlobalComplianceNotifyResponse>(json)!;
}
