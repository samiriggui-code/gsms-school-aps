'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { landingLeadsListQueryKey } from '../constants/query-keys';
import type { LandingLeadKindFilter } from '../lib/landing-lead-kind';

export type LandingLeadRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  formation: { id: string; name: string; slug: string } | null;
  candidature: { id: string; userId: string; status: string } | null;
};

export type LandingLeadsStats = {
  totalLanding: number;
  quote: number;
  preinscription: number;
  /** Leads landing encore au statut CRM « Nouveau ». */
  nouveaux: number;
};

export type LandingLeadsResponse = {
  stats: LandingLeadsStats;
  items: LandingLeadRow[];
  pagination: { page: number; limit: number; total: number };
};

export function useLandingLeadsQuery(args: {
  kind: LandingLeadKindFilter;
  q: string;
  page: number;
  limit: number;
}) {
  return useQuery({
    queryKey: [...landingLeadsListQueryKey, args] as const,
    queryFn: async (): Promise<LandingLeadsResponse | undefined> => {
      const params = new URLSearchParams({
        kind: args.kind,
        page: String(args.page),
        limit: String(args.limit),
      });
      if (args.q.trim()) params.set('q', args.q.trim());
      const res = await apiFetch(
        `/api/sections/communication-contenu/marketing/landing-leads?${params.toString()}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible.';
        throw new Error(msg);
      }
      return unwrapSectionApiData<LandingLeadsResponse>(json);
    },
    staleTime: 60_000,
  });
}
