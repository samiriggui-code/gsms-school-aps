'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  COLLABORATEUR_ACTIVITY_EVENT,
  getCollaborateurActivityChannel,
} from '@/lib/collaborateur-activity';
import { fetchRhActivityHistoryFromIam } from '@/lib/rh-iam-activity-history';
import type {
  RhActivityHistoryEntry,
  RhActivityHistorySummary,
} from '@/lib/rh-iam-activity-history';
import { usePusher } from '@/hooks/use-pusher';

export type FormateurHistoryEntry = RhActivityHistoryEntry;
export type FormateurHistorySummary = RhActivityHistorySummary;

interface UseFormateurHistoryOptions {
  enabled?: boolean;
  limit?: number;
  live?: boolean;
}

const EMPTY_SUMMARY: RhActivityHistorySummary = {
  total: 0,
  createCount: 0,
  updateCount: 0,
  deleteCount: 0,
};

export function useFormateurHistory(formateurId?: string, options?: UseFormateurHistoryOptions) {
  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const companyId =
    (session?.user as any)?.companyId || (session?.user as any)?.tenantId;
  const limit = options?.limit ?? 20;
  const enabled = Boolean(options?.enabled ?? true) && Boolean(formateurId);
  const live = options?.live ?? true;

  const query = useQuery({
    queryKey: ['formateur-history', formateurId, limit],
    queryFn: () => fetchRhActivityHistoryFromIam(formateurId!, limit),
    enabled,
  });

  usePusher(
    sessionUserId,
    () => {
      void query.refetch();
    },
    {
      channelName:
        companyId && formateurId
          ? getCollaborateurActivityChannel(companyId, formateurId)
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
