'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { financeFactureDetailQueryKey, financeFactureListQueryKey } from '../constants/query-keys';

export function useFacturePatchMutation(factureId: string | null) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      if (!factureId) throw new Error('Élément introuvable.');
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/factures/${factureId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Mise à jour impossible.');
      }
      return unwrapSectionApiData<unknown>(json);
    },
    onSuccess: () => {
      toast.success(t('facture.updatedSuccess'));
      if (factureId) {
        void queryClient.invalidateQueries({ queryKey: [...financeFactureDetailQueryKey, factureId] });
        void queryClient.invalidateQueries({ queryKey: [...financeFactureListQueryKey] });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
