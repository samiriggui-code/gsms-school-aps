'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { FinanceCatalogLineRow } from '@/lib/finance-catalog-line-types';

export const financeCatalogLinesQueryKey = [
  'administration-facturation',
  'finance',
  'catalog-lines',
] as const;

export function useFinanceCatalogLinesQuery(enabled: boolean) {
  return useQuery({
    queryKey: financeCatalogLinesQueryKey,
    queryFn: async (): Promise<FinanceCatalogLineRow[]> => {
      const res = await apiFetch('/api/sections/administration-facturation/finance/catalog-lines');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible.');
      }
      const data = unwrapSectionApiData<{ items?: FinanceCatalogLineRow[] }>(json);
      return data?.items ?? [];
    },
    enabled,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
