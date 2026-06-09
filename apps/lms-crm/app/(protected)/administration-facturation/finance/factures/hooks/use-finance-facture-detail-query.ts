'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { financeFactureDetailQueryKey } from '../constants/query-keys';

/** Détail d’un dossier à facturer — même modèle que la proposition (`FinanceDevis`) au statut accepté. */
export type FinanceFactureDetail = {
  id: string;
  referenceCode: string;
  title: string;
  status: string;
  clientSnapshot: Record<string, unknown>;
  lines: unknown;
  subtotalHt: number;
  vatTotal: number;
  totalTtc: number;
  currency: string;
  validUntil: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
  formationId: string | null;
  candidatureId?: string | null;
  formationSessionId?: string | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    notes: string | null;
    source: string | null;
  } | null;
  formation: { id: string; name: string; slug: string } | null;
  candidature?: { id: string; status: string; userId: string } | null;
  formationSession?: { id: string; dateDisplayLabel: string; location: string } | null;
  invoicePdf?: {
    id: string;
    url: string;
    originalName: string;
    size: number;
    createdAt: string;
  } | null;
};

export function useFinanceFactureDetailQuery(factureId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...financeFactureDetailQueryKey, factureId] as const,
    queryFn: async (): Promise<FinanceFactureDetail | undefined> => {
      if (!factureId) return undefined;
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/factures/${factureId}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible.';
        throw new Error(msg);
      }
      return unwrapSectionApiData<FinanceFactureDetail>(json);
    },
    enabled: enabled && !!factureId,
    staleTime: 30_000,
  });
}
