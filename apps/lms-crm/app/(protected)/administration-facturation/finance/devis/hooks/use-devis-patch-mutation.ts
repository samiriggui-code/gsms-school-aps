'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { financeDevisDetailQueryKey, financeDevisListQueryKey } from '../constants/query-keys';

export function useDevisPatchMutation(devisId: string | null) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      if (!devisId) throw new Error('Devis introuvable.');
      const res = await apiFetch(`/api/sections/administration-facturation/finance/devis/${devisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Mise à jour impossible.');
      }
      return unwrapSectionApiData<unknown>(json);
    },
    onSuccess: () => {
      toast.success(t('devis.updatedSuccess'));
      if (devisId) {
        void queryClient.invalidateQueries({ queryKey: [...financeDevisDetailQueryKey, devisId] });
        void queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
