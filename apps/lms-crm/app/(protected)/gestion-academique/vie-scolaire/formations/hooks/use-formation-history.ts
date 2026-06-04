'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import {
  Formation_ACTIVITY_EVENT,
  getFormationActivityChannel,
} from '@/lib/formation-activity';
import { usePusher } from '@/hooks/use-pusher';

export interface FormationHistoryEntry {
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

export interface FormationHistorySummary {
  total: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

interface FormationHistoryResponse {
  data: FormationHistoryEntry[];
  summary: FormationHistorySummary;
}

interface UseFormationHistoryOptions {
  enabled?: boolean;
  limit?: number;
  live?: boolean;
}

const EMPTY_SUMMARY: FormationHistorySummary = {
  total: 0,
  createCount: 0,
  updateCount: 0,
  deleteCount: 0,
};

function normalizeHistoryResponse(payload: unknown): FormationHistoryResponse {
  const fallback: FormationHistoryResponse = {
    data: [],
    summary: EMPTY_SUMMARY,
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const rootData = record.data;
  const rootSummary = record.summary;

  // Direct format: { data: FormationHistoryEntry[], summary }
  if (Array.isArray(rootData)) {
    return {
      data: rootData as FormationHistoryEntry[],
      summary:
        rootSummary && typeof rootSummary === 'object'
          ? (rootSummary as FormationHistorySummary)
          : EMPTY_SUMMARY,
    };
  }

  // Wrapped format from shared ok(): { success: true, data: { items, pagination } }
  if (rootData && typeof rootData === 'object') {
    const nestedData = rootData as Record<string, unknown>;
    const items = nestedData.items;
    if (Array.isArray(items)) {
      return {
        data: items as FormationHistoryEntry[],
        summary:
          rootSummary && typeof rootSummary === 'object'
            ? (rootSummary as FormationHistorySummary)
            : EMPTY_SUMMARY,
      };
    }
  }

  return fallback;
}

async function fetchFormationHistory(
  FormationId: string,
  limit: number,
) {
  const response = await apiFetch(
    `/api/sections/gestion-ressources/rh/Formations/${FormationId}/history?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error("Impossible de charger l'historique Formation.");
  }

  const json = await response.json();
  return normalizeHistoryResponse(json);
}

export function useFormationHistory(
  FormationId?: string,
  options?: UseFormationHistoryOptions,
) {
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const companyId =
    (session?.user as any)?.companyId || (session?.user as any)?.tenantId;
  const limit = options?.limit ?? 20;
  const enabled = Boolean(options?.enabled ?? true) && Boolean(FormationId);
  const live = options?.live ?? true;

  const query = useQuery({
    queryKey: ['formation-history', FormationId, limit],
    queryFn: () => fetchFormationHistory(FormationId!, limit),
    enabled,
  });

  usePusher(
    sessionUserId,
    () => {
      void query.refetch();
    },
    {
      channelName:
        companyId && FormationId
          ? getFormationActivityChannel(companyId, FormationId)
          : undefined,
      eventName: Formation_ACTIVITY_EVENT,
      enabled: enabled && live,
    },
  );

  return {
    ...query,
    entries: query.data?.data ?? [],
    summary: query.data?.summary ?? EMPTY_SUMMARY,
  };
}



