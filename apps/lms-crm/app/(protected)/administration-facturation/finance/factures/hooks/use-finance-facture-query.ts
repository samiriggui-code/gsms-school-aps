'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { financeFactureListQueryKey } from '../constants/query-keys';

import type { FinancePaymentSummary } from '@/lib/finance/finance-payment-summary';

export type FinanceFactureRow = {
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
  clientCompany: string | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  formation: { id: string; name: string; slug: string } | null;
  paymentSummary: FinancePaymentSummary;
};

export type FinanceFactureListStats = {
  total: number;
  montantTtcTotal: number;
  avecFormation: number;
  sansFormation: number;
};

export type FinanceFactureListResponse = {
  stats: FinanceFactureListStats;
  items: FinanceFactureRow[];
  pagination: { page: number; limit: number; total: number };
};

export type FinanceFactureListQueryArgs = {
  leadId: string | null;
  page: number;
  limit: number;
  q?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
};

export function useFinanceFactureQuery(args: FinanceFactureListQueryArgs) {
  return useQuery({
    queryKey: [...financeFactureListQueryKey, args] as const,
    queryFn: async (): Promise<FinanceFactureListResponse | undefined> => {
      const params = new URLSearchParams({
        page: String(args.page),
        limit: String(args.limit),
      });
      if (args.leadId) params.set('leadId', args.leadId);
      const q = args.q?.trim();
      if (q) params.set('q', q);
      if (args.sort) params.set('sort', args.sort);
      if (args.dir) params.set('dir', args.dir);
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/factures?${params.toString()}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible.';
        throw new Error(msg);
      }
      return unwrapSectionApiData<FinanceFactureListResponse>(json);
    },
    staleTime: 60_000,
  });
}
