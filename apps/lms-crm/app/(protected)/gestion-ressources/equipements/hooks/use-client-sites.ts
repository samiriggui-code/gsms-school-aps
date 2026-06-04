'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type ClientSiteOption = {
  id: string;
  name: string;
  code?: string | null;
};

export function useClientSites() {
  return useQuery({
    queryKey: ['client-sites'],
    queryFn: async (): Promise<ClientSiteOption[]> => {
      const response = await apiFetch('/api/sections/gestion-sites-clients/sites');
      if (!response.ok) {
        throw new Error('Impossible de charger les sites.');
      }
      const json = await response.json();
      return json.data?.items ?? [];
    },
    staleTime: 60_000,
  });
}
