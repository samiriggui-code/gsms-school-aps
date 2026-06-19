import { apiFetch } from '@/lib/api';
import type { RhComplianceDocRow } from '@/lib/gestion-ressources/rh-user-compliance-rows';
import type { RhUserComplianceResult } from '@/lib/gestion-ressources/rh-conformite-compliance';

export type CollaborateurComplianceEvent = {
  id: string;
  eventType: string;
  createdAt: string;
  actor: { firstName: string | null; lastName: string | null; email: string } | null;
  dossierItem: { code: string; label: string } | null;
};

export type CollaborateurComplianceResponse = {
  compliance: RhUserComplianceResult;
  rows: RhComplianceDocRow[];
  summary: {
    total: number;
    missing: number;
    expired: number;
    expiringSoon: number;
    warning: number;
    valid: number;
    nonCompliant: number;
    globalStatus: RhUserComplianceResult['status'];
  };
  events: CollaborateurComplianceEvent[];
};

export async function fetchCollaborateurCompliance(
  userId: string,
): Promise<CollaborateurComplianceResponse> {
  const res = await apiFetch(
    `/api/sections/gestion-ressources/rh/collaborateurs/${userId}/compliance`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? body.message ?? 'Impossible de charger la conformité.');
  }
  const json = await res.json();
  return json.data ?? json;
}
