'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchTopbarSummary } from '@/lib/topbar-api';
import { scopeFromPathname } from '@/lib/notifications-scope';

export function useTopbarSummary() {
  const pathname = usePathname();
  const scope = scopeFromPathname(pathname);

  return useQuery({
    queryKey: ['topbar-summary', scope],
    queryFn: () => fetchTopbarSummary(scope),
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
