'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type SubcontractorItem = {
  id: string;
  name: string;
  city?: string | null;
};

export const useSubcontractorSelectQuery = () => {
  return useQuery({
    queryKey: ['subcontractors-select'],
    queryFn: async (): Promise<SubcontractorItem[]> => {
      try {
        const response = await apiFetch('/api/sections/securite-configuration/acces/users/select');
        if (!response.ok) return [];

        const rows = await response.json();

        return (Array.isArray(rows) ? rows : [])
          .filter((row: any) => row?.userCategory === 'SUBCONTRACTOR')
          .map((row: any) => ({
            id: String(row.id),
            name: String(row.name ?? row.fullName ?? 'Sous-traitant'),
            city: row.city ?? null,
          }));
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};
