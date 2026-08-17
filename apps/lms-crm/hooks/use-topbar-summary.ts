'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchTopbarSummary } from '@/lib/topbar-api';
import { scopeFromPathname } from '@/lib/notifications-scope';
import { isPusherClientConfigured } from '@/hooks/use-pusher';

export function useTopbarSummary() {
  const pathname = usePathname();
  const scope = scopeFromPathname(pathname);
  const pusherLive = isPusherClientConfigured();

  return useQuery({
    queryKey: ['topbar-summary', scope],
    queryFn: () => fetchTopbarSummary(scope),
    // Avec Pusher, les invalidations push suffisent — polling de secours plus lent.
    refetchInterval: pusherLive ? 90_000 : 30_000,
    refetchOnWindowFocus: false,
    staleTime: pusherLive ? 30_000 : 15_000,
  });
}
