'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { qualiopiIndicatorsByCriterion, type QualiopiAuditStatus } from '@/lib/of/qualiopi-indicators';
import type { QualiopiCoveragePayload } from '@/lib/of/qualiopi-coverage';

export type ItemStatus =
  | 'MISSING'
  | 'REQUESTED'
  | 'RECEIVED'
  | 'VALIDATED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'WAIVED';

export const STATUS_TO_AUDIT: Partial<Record<ItemStatus, QualiopiAuditStatus>> = {
  VALIDATED: 'OK',
  REJECTED: 'KO',
  WAIVED: 'NA',
  REQUESTED: 'TO_FIX',
};

export const AUDIT_STATUS_LABEL: Record<QualiopiAuditStatus, string> = {
  OK: 'OK',
  KO: 'KO',
  TO_FIX: 'À réparer',
  NA: 'N/A',
};

export type DossierBootstrap = {
  dossierId: string;
  summary: {
    completenessPct: number;
    status: string;
    missingRequired: string[];
  };
};

export type ComplianceItemRow = {
  id: string;
  code: string;
  label: string;
  status: ItemStatus;
  fileCategory: string;
  fileAssetId: string | null;
  rejectionReason: string | null;
  fileAsset: { id: string; url: string; originalName: string } | null;
};

export type QualiopiClasseurCounts = {
  total: number;
  ok: number;
  ko: number;
  toFix: number;
  na: number;
  pending: number;
};

export const QUALIOPI_CLASSEUR_QUERY_KEY = 'qualiopi-classeur';

export function useQualiopiClasseur() {
  const bootstrapQuery = useQuery({
    queryKey: [QUALIOPI_CLASSEUR_QUERY_KEY, 'bootstrap'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<DossierBootstrap & { items: ComplianceItemRow[] }>(
        await res.json(),
      );
    },
    staleTime: 1000 * 30,
  });

  const coverageQuery = useQuery({
    queryKey: [QUALIOPI_CLASSEUR_QUERY_KEY, 'coverage'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi/coverage');
      if (!res.ok) throw new Error('coverage');
      return unwrapSectionApiData<QualiopiCoveragePayload>(await res.json());
    },
    staleTime: 1000 * 60,
  });

  const dossierId = bootstrapQuery.data?.dossierId;
  const items = bootstrapQuery.data?.items ?? [];

  const itemsByCode = useMemo(() => {
    const map = new Map<string, ComplianceItemRow>();
    for (const row of items) map.set(row.code, row);
    return map;
  }, [items]);

  const coveredByCode = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const ind of coverageQuery.data?.indicators ?? []) {
      map.set(ind.code, ind.covered);
    }
    return map;
  }, [coverageQuery.data]);

  const grouped = useMemo(() => qualiopiIndicatorsByCriterion(), []);

  const counts = useMemo((): QualiopiClasseurCounts => {
    const total = items.length;
    const ok = items.filter((r) => r.status === 'VALIDATED').length;
    const ko = items.filter((r) => r.status === 'REJECTED').length;
    const toFix = items.filter((r) => r.status === 'REQUESTED').length;
    const na = items.filter((r) => r.status === 'WAIVED').length;
    const pending = total - ok - ko - toFix - na;
    return { total, ok, ko, toFix, na, pending };
  }, [items]);

  const globalOk = counts.ko === 0 && counts.pending === 0;
  const completenessPct = bootstrapQuery.data?.summary.completenessPct ?? 0;

  return {
    bootstrapQuery,
    coverageQuery,
    dossierId,
    items,
    itemsByCode,
    coveredByCode,
    grouped,
    counts,
    globalOk,
    completenessPct,
    isLoading: bootstrapQuery.isLoading,
    isError: bootstrapQuery.isError,
  };
}
