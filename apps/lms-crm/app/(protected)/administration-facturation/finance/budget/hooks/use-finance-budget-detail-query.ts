'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { FinanceBudgetLineDetail } from '@/lib/finance/finance-budget-detail-build';

export const financeBudgetDetailQueryKey = ['finance-budget-detail'] as const;

export function useFinanceBudgetDetailQuery(lineId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...financeBudgetDetailQueryKey, lineId] as const,
    enabled: enabled && !!lineId,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/budget/${encodeURIComponent(lineId!)}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible',
        );
      }
      const data = unwrapSectionApiData<FinanceBudgetLineDetail>(json);
      if (!data) throw new Error('Réponse vide');
      return data;
    },
    staleTime: 30_000,
  });
}
