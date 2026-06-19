'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type RhPositionOption = {
  id: string;
  label: string;
  code: string | null;
};

export function useRhPositionSelectQuery() {
  return useQuery({
    queryKey: ['rh-positions'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/rh/positions');
      if (!res.ok) throw new Error('Impossible de charger les postes.');
      const json = await res.json();
      const rows = json.data ?? json;
      return (Array.isArray(rows) ? rows : []) as RhPositionOption[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
