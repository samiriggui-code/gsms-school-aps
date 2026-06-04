'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import {
  Etudiant_ACTIVITY_EVENT,
  getEtudiantActivityChannel,
} from '@/lib/etudiant-activity';
import { usePusher } from '@/hooks/use-pusher';

export interface EtudiantHistoryEntry {
  id: string;
  action: string;
  label: string;
  description: string;
  metadata: {
    actorName?: string;
    collaboratorName?: string;
    collaboratorEmail?: string;
    contactEmail?: string | null;
    changedFields?: string[];
  } | string | null;
  createdAt: string;
  ipAddress?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export interface EtudiantHistorySummary {
  total: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

interface EtudiantHistoryResponse {
  data: EtudiantHistoryEntry[];
  summary: EtudiantHistorySummary;
}

interface UseEtudiantHistoryOptions {
  enabled?: boolean;
  limit?: number;
  live?: boolean;
}

const EMPTY_SUMMARY: EtudiantHistorySummary = {
  total: 0,
  createCount: 0,
  updateCount: 0,
  deleteCount: 0,
};

function normalizeHistoryResponse(payload: unknown): EtudiantHistoryResponse {
  const fallback: EtudiantHistoryResponse = {
    data: [],
    summary: EMPTY_SUMMARY,
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const rootData = record.data;
  const rootSummary = record.summary;

  // Direct format: { data: EtudiantHistoryEntry[], summary }
  if (Array.isArray(rootData)) {
    return {
      data: rootData as EtudiantHistoryEntry[],
      summary:
        rootSummary && typeof rootSummary === 'object'
          ? (rootSummary as EtudiantHistorySummary)
          : EMPTY_SUMMARY,
    };
  }

  // Wrapped format from shared ok(): { success: true, data: { items, pagination } }
  if (rootData && typeof rootData === 'object') {
    const nestedData = rootData as Record<string, unknown>;
    const items = nestedData.items;
    if (Array.isArray(items)) {
      return {
        data: items as EtudiantHistoryEntry[],
        summary:
          rootSummary && typeof rootSummary === 'object'
            ? (rootSummary as EtudiantHistorySummary)
            : EMPTY_SUMMARY,
      };
    }
  }

  return fallback;
}

async function fetchEtudiantHistory(
  EtudiantId: string,
  limit: number,
) {
  const response = await apiFetch(
    `/api/sections/gestion-ressources/rh/Etudiants/${EtudiantId}/history?limit=${limit}`,
  );

  if (!response.ok) {
    // Endpoint /history souvent absent (proxification RH) ; éviter le toast global react-query.
    return { data: [], summary: EMPTY_SUMMARY };
  }

  const json = await response.json();
  return normalizeHistoryResponse(json);
}

export function useEtudiantHistory(
  EtudiantId?: string,
  options?: UseEtudiantHistoryOptions,
) {
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const companyId =
    (session?.user as any)?.companyId || (session?.user as any)?.tenantId;
  const limit = options?.limit ?? 20;
  const enabled = Boolean(options?.enabled ?? true) && Boolean(EtudiantId);
  const live = options?.live ?? true;

  const query = useQuery({
    queryKey: ['etudiant-history', EtudiantId, limit],
    queryFn: () => fetchEtudiantHistory(EtudiantId!, limit),
    enabled,
  });

  usePusher(
    sessionUserId,
    () => {
      void query.refetch();
    },
    {
      channelName:
        companyId && EtudiantId
          ? getEtudiantActivityChannel(companyId, EtudiantId)
          : undefined,
      eventName: Etudiant_ACTIVITY_EVENT,
      enabled: enabled && live,
    },
  );

  return {
    ...query,
    entries: query.data?.data ?? [],
    summary: query.data?.summary ?? EMPTY_SUMMARY,
  };
}




