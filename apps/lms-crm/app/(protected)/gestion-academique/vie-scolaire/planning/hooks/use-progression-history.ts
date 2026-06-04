'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import {
  Planning_ACTIVITY_EVENT,
  getPlanningActivityChannel,
} from '@/lib/planning-activity';
import { usePusher } from '@/hooks/use-pusher';

export interface PlanningHistoryEntry {
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

export interface PlanningHistorySummary {
  total: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

interface PlanningHistoryResponse {
  data: PlanningHistoryEntry[];
  summary: PlanningHistorySummary;
}

interface UsePlanningHistoryOptions {
  enabled?: boolean;
  limit?: number;
  live?: boolean;
}

const EMPTY_SUMMARY: PlanningHistorySummary = {
  total: 0,
  createCount: 0,
  updateCount: 0,
  deleteCount: 0,
};

function normalizeHistoryResponse(payload: unknown): PlanningHistoryResponse {
  const fallback: PlanningHistoryResponse = {
    data: [],
    summary: EMPTY_SUMMARY,
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const rootData = record.data;
  const rootSummary = record.summary;

  // Direct format: { data: PlanningHistoryEntry[], summary }
  if (Array.isArray(rootData)) {
    return {
      data: rootData as PlanningHistoryEntry[],
      summary:
        rootSummary && typeof rootSummary === 'object'
          ? (rootSummary as PlanningHistorySummary)
          : EMPTY_SUMMARY,
    };
  }

  // Wrapped format from shared ok(): { success: true, data: { items, pagination } }
  if (rootData && typeof rootData === 'object') {
    const nestedData = rootData as Record<string, unknown>;
    const items = nestedData.items;
    if (Array.isArray(items)) {
      return {
        data: items as PlanningHistoryEntry[],
        summary:
          rootSummary && typeof rootSummary === 'object'
            ? (rootSummary as PlanningHistorySummary)
            : EMPTY_SUMMARY,
      };
    }
  }

  return fallback;
}

async function fetchPlanningHistory(
  PlanningId: string,
  limit: number,
) {
  const response = await apiFetch(
    `/api/sections/gestion-ressources/rh/Plannings/${PlanningId}/history?limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error("Impossible de charger l'historique Planning.");
  }

  const json = await response.json();
  return normalizeHistoryResponse(json);
}

export function usePlanningHistory(
  PlanningId?: string,
  options?: UsePlanningHistoryOptions,
) {
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const companyId =
    (session?.user as any)?.companyId || (session?.user as any)?.tenantId;
  const limit = options?.limit ?? 20;
  const enabled = Boolean(options?.enabled ?? true) && Boolean(PlanningId);
  const live = options?.live ?? true;

  const query = useQuery({
    queryKey: ['planning-history', PlanningId, limit],
    queryFn: () => fetchPlanningHistory(PlanningId!, limit),
    enabled,
  });

  usePusher(
    sessionUserId,
    () => {
      void query.refetch();
    },
    {
      channelName:
        companyId && PlanningId
          ? getPlanningActivityChannel(companyId, PlanningId)
          : undefined,
      eventName: Planning_ACTIVITY_EVENT,
      enabled: enabled && live,
    },
  );

  return {
    ...query,
    entries: query.data?.data ?? [],
    summary: query.data?.summary ?? EMPTY_SUMMARY,
  };
}



