'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { financeFactureDetailQueryKey } from '../constants/query-keys';

type StoredPdf = {
  id: string;
  url: string;
  originalName: string;
  size: number;
  createdAt: string;
};

export function useFacturePdfMutation(factureId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<StoredPdf> => {
      if (!factureId) throw new Error('Dossier introuvable.');
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/factures/${factureId}/pdf`,
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Génération impossible.';
        throw new Error(msg);
      }
      const data = unwrapSectionApiData<StoredPdf>(json);
      if (!data) throw new Error('Réponse invalide du serveur.');
      return data;
    },
    onSuccess: () => {
      if (factureId) {
        void queryClient.invalidateQueries({ queryKey: [...financeFactureDetailQueryKey, factureId] });
      }
    },
  });
}
