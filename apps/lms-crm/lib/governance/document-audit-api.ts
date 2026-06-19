import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type {
  DocumentAuditRow,
  DocumentAuditSource,
} from '@/lib/governance/document-audit-trail';

export type DocumentAuditListResponse = {
  data: DocumentAuditRow[];
  stats: {
    total: number;
    compliance: number;
    fileLifecycle: number;
    last7Days: number;
    today: number;
  };
  filters: {
    modules: string[];
    entityTypes: string[];
    eventTypes: string[];
  };
  pagination: { page: number; limit: number; total: number };
};

export async function fetchDocumentAuditTrail(params: {
  page: number;
  limit: number;
  q?: string;
  source?: DocumentAuditSource | 'all';
  eventType?: string;
  module?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DocumentAuditListResponse> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.q?.trim()) sp.set('q', params.q.trim());
  if (params.source && params.source !== 'all') sp.set('source', params.source);
  if (params.eventType) sp.set('eventType', params.eventType);
  if (params.module) sp.set('module', params.module);
  if (params.entityType) sp.set('entityType', params.entityType);
  if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
  if (params.dateTo) sp.set('dateTo', params.dateTo);

  const res = await apiFetch(
    `/api/sections/securite-configuration/gouvernance-donnees/audit?${sp}`,
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ??
        'Impossible de charger l’audit documentaire.',
    );
  }
  return unwrapSectionApiData<DocumentAuditListResponse>(json)!;
}

export type { DocumentAuditRow, DocumentAuditSource };
