'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { financeDevisDetailQueryKey } from '../constants/query-keys';

export type FinanceDevisDetail = {
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
  plaquetteMessages?: {
    id: string;
    authorKind: string;
    body: string;
    authorLabel: string | null;
    createdAt: string;
  }[];
};

export function useFinanceDevisDetailQuery(
  devisId: string | null,
  enabled: boolean,
  opts?: { refetchIntervalMs?: number | false },
) {
  return useQuery({
    queryKey: [...financeDevisDetailQueryKey, devisId] as const,
    queryFn: async (): Promise<FinanceDevisDetail | undefined> => {
      if (!devisId) return undefined;
      const res = await apiFetch(`/api/sections/administration-facturation/finance/devis/${devisId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible.';
        throw new Error(msg);
      }
      return unwrapSectionApiData<FinanceDevisDetail>(json);
    },
    enabled: enabled && !!devisId,
    staleTime: 30_000,
    refetchInterval: opts?.refetchIntervalMs || false,
  });
}
