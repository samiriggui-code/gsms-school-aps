'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface ConformiteHistoryEntry {
  id: string;
  action: string;
  label: string;
  description: string;
  metadata: any;
  createdAt: string;
  ipAddress?: string | null;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export interface ConformiteHistorySummary {
  total: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

interface ConformiteHistoryResponse {
  data: ConformiteHistoryEntry[];
  summary: ConformiteHistorySummary;
}

const EMPTY_SUMMARY: ConformiteHistorySummary = {
  total: 0,
  createCount: 0,
  updateCount: 0,
  deleteCount: 0,
};

async function fetchConformiteHistory(
  conformiteId: string,
  limit: number,
) {
  const response = await apiFetch(
    `/api/sections/gestion-ressources/rh/conformite/${conformiteId}/history?limit=${limit}`,
  );

  if (!response.ok) {
    return { data: [], summary: EMPTY_SUMMARY };
  }

  return response.json();
}

export function useConformiteHistory(
  conformiteId?: string,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 20;
  const enabled = Boolean(options?.enabled ?? true) && Boolean(conformiteId);

  const query = useQuery({
    queryKey: ['conformite-history', conformiteId, limit],
    queryFn: () => fetchConformiteHistory(conformiteId!, limit),
    enabled,
  });

  return {
    ...query,
    entries: (query.data as any)?.data ?? [],
    summary: (query.data as any)?.summary ?? EMPTY_SUMMARY,
  };
}
