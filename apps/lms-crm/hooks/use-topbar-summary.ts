'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTopbarSummary } from '@/lib/topbar-api';

export function useTopbarSummary() {
  return useQuery({
    queryKey: ['topbar-summary'],
    queryFn: fetchTopbarSummary,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
