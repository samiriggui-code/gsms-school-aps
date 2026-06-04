'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export type SupportTicketRow = {
  id: string;
  referenceCode: string;
  subject: string;
  status: string;
  priority: string;
  requesterName: string;
  requesterEmail: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string | null; email: string } | null;
};

export type SupportTicketsResponse = {
  stats: { total: number; open: number; inProgress: number; resolved: number };
  items: SupportTicketRow[];
  pagination: { page: number; limit: number; total: number };
};

export function useSupportTicketsQuery(args: { page: number; limit: number; q?: string; status?: string }) {
  return useQuery({
    queryKey: ['support-tickets', args] as const,
    queryFn: async (): Promise<SupportTicketsResponse | undefined> => {
      const sp = new URLSearchParams({ page: String(args.page), limit: String(args.limit) });
      if (args.q?.trim()) sp.set('q', args.q.trim());
      if (args.status && args.status !== 'all') sp.set('status', args.status);
      const res = await apiFetch(`/api/sections/support-qualite/support/tickets?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<SupportTicketsResponse>(json);
    },
    staleTime: 30_000,
  });
}
