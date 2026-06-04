'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type ExamenItem = {
  id: string;
  name: string;
  city?: string | null;
};

export const useExamenSelectQuery = () => {
  return useQuery({
    queryKey: ['examens-select'],
    queryFn: async (): Promise<ExamenItem[]> => {
      try {
        const response = await apiFetch('/api/sections/securite-configuration/acces/users/select');
        if (!response.ok) return [];

        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        return rows
          .filter((row: any) => row?.category === 'Examen')
          .map((row: any) => ({
            id: String(row.id),
            name: String(row.name ?? row.fullName ?? 'Examen'),
            city: row.city ?? null,
          }));
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};
