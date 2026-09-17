'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { QualiopiSessionEvaluatePayload } from '@/lib/of/qualiopi-evaluation-types';

export type QualiopiSessionOption = {
  id: string;
  label: string | null;
  formationName: string;
  readinessStatus: string;
  startDate: string | null;
  endDate: string | null;
  participantCount: number;
};

export function useQualiopiPasseport() {
  const [sessionId, setSessionId] = useState('');

  const sessionsQuery = useQuery({
    queryKey: ['qualiopi', 'passeport', 'sessions'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi/sessions?take=50');
      if (!res.ok) throw new Error('sessions');
      return unwrapSectionApiData<{ items: QualiopiSessionOption[] }>(await res.json());
    },
    staleTime: 30_000,
  });

  const evaluateQuery = useQuery({
    queryKey: ['qualiopi', 'passeport', 'evaluate', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/qualiopi/evaluate?sessionId=${encodeURIComponent(sessionId)}`,
      );
      if (res.status === 404) throw new Error('SESSION_NOT_FOUND');
      if (!res.ok) throw new Error('evaluate');
      return unwrapSectionApiData<QualiopiSessionEvaluatePayload>(await res.json());
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const runStressTest = useCallback(() => {
    if (!sessionId) return;
    void evaluateQuery.refetch();
  }, [sessionId, evaluateQuery]);

  return {
    sessionId,
    setSessionId,
    sessions: sessionsQuery.data?.items ?? [],
    sessionsLoading: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.isError,
    evaluation: evaluateQuery.data ?? null,
    evaluateLoading: evaluateQuery.isFetching,
    evaluateError: evaluateQuery.isError,
    evaluateErrorMessage:
      evaluateQuery.error instanceof Error ? evaluateQuery.error.message : null,
    runStressTest,
  };
}
