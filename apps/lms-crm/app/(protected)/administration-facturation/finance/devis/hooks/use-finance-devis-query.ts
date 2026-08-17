'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { financeDevisListQueryKey } from '../constants/query-keys';

export type FinanceDevisRow = {
  id: string;
  referenceCode: string;
  title: string;
  status: string;
  subtotalHt: number;
  vatTotal: number;
  totalTtc: number;
  currency: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
  formationId: string | null;
  /** Raison sociale issue du contexte client (snapshot), si renseignée. */
  clientCompany: string | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  formation: { id: string; name: string; slug: string } | null;
  /** Messages échangés via la plaquette publique (client + RH). */
  plaquetteMessageCount: number;
};

export type FinanceDevisListStats = {
  total: number;
  brouillons: number;
  envoyes: number;
  pipelineTtc: number;
};

export type FinanceDevisListResponse = {
  stats: FinanceDevisListStats;
  items: FinanceDevisRow[];
  pagination: { page: number; limit: number; total: number };
};

export type FinanceDevisListQueryArgs = {
  leadId: string | null;
  page: number;
  limit: number;
  q?: string;
  /** `all` ou valeur `FinanceDevisStatus`. */
  status?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
};

export function useFinanceDevisQuery(args: FinanceDevisListQueryArgs) {
  return useQuery({
    queryKey: [...financeDevisListQueryKey, args] as const,
    queryFn: async (): Promise<FinanceDevisListResponse | undefined> => {
      const params = new URLSearchParams({
        page: String(args.page),
        limit: String(args.limit),
      });
      if (args.leadId) params.set('leadId', args.leadId);
      const q = args.q?.trim();
      if (q) params.set('q', q);
      const st = args.status?.trim();
      if (st && st !== 'all') params.set('status', st);
      if (args.sort) params.set('sort', args.sort);
      if (args.dir) params.set('dir', args.dir);
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/devis?${params.toString()}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible.';
        throw new Error(msg);
      }
      return unwrapSectionApiData<FinanceDevisListResponse>(json);
    },
    staleTime: 60_000,
  });
}
