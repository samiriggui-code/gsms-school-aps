'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import {
  COLLABORATEUR_ACTIVITY_EVENT,
  getCollaborateurActivityChannel,
} from '@/lib/collaborateur-activity';
import { usePusher } from '@/hooks/use-pusher';

export interface CollaborateurHistoryEntry {
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

export interface CollaborateurHistorySummary {
  total: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

interface CollaborateurHistoryResponse {
  data: CollaborateurHistoryEntry[];
  summary: CollaborateurHistorySummary;
}

interface UseCollaborateurHistoryOptions {
  enabled?: boolean;
  limit?: number;
  live?: boolean;
}

const EMPTY_SUMMARY: CollaborateurHistorySummary = {
  total: 0,
  createCount: 0,
  updateCount: 0,
  deleteCount: 0,
};

function normalizeHistoryResponse(payload: unknown): CollaborateurHistoryResponse {
  const fallback: CollaborateurHistoryResponse = {
    data: [],
    summary: EMPTY_SUMMARY,
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const rootData = record.data;
  const rootSummary = record.summary;

  // Direct format: { data: CollaborateurHistoryEntry[], summary }
  if (Array.isArray(rootData)) {
    return {
      data: rootData as CollaborateurHistoryEntry[],
      summary:
        rootSummary && typeof rootSummary === 'object'
          ? (rootSummary as CollaborateurHistorySummary)
          : EMPTY_SUMMARY,
    };
  }

  // Wrapped format from shared ok(): { success: true, data: { items, pagination } }
  if (rootData && typeof rootData === 'object') {
    const nestedData = rootData as Record<string, unknown>;
    const items = nestedData.items;
    if (Array.isArray(items)) {
      return {
        data: items as CollaborateurHistoryEntry[],
        summary:
          rootSummary && typeof rootSummary === 'object'
            ? (rootSummary as CollaborateurHistorySummary)
            : EMPTY_SUMMARY,
      };
    }
  }

  return fallback;
}

async function fetchCollaborateurHistory(
  collaborateurId: string,
  limit: number,
) {
  const response = await apiFetch(
    `/api/sections/gestion-ressources/rh/collaborateurs/${collaborateurId}/history?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error("Impossible de charger l'historique collaborateur.");
  }

  const json = await response.json();
  return normalizeHistoryResponse(json);
}

export function useCollaborateurHistory(
  collaborateurId?: string,
  options?: UseCollaborateurHistoryOptions,
) {
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const companyId =
    (session?.user as any)?.companyId || (session?.user as any)?.tenantId;
  const limit = options?.limit ?? 20;
  const enabled = Boolean(options?.enabled ?? true) && Boolean(collaborateurId);
  const live = options?.live ?? true;

  const query = useQuery({
    queryKey: ['collaborateur-history', collaborateurId, limit],
    queryFn: () => fetchCollaborateurHistory(collaborateurId!, limit),
    enabled,
  });

  usePusher(
    sessionUserId,
    () => {
      void query.refetch();
    },
    {
      channelName:
        companyId && collaborateurId
          ? getCollaborateurActivityChannel(companyId, collaborateurId)
          : undefined,
      eventName: COLLABORATEUR_ACTIVITY_EVENT,
      enabled: enabled && live,
    },
  );

  return {
    ...query,
    entries: query.data?.data ?? [],
    summary: query.data?.summary ?? EMPTY_SUMMARY,
  };
}
