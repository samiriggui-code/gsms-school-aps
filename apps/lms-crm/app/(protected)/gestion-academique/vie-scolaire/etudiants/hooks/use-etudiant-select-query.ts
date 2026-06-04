'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type EtudiantItem = {
  id: string;
  name: string;
  city?: string | null;
};

export const useEtudiantSelectQuery = () => {
  return useQuery({
    queryKey: ['Etudiants-select'],
    queryFn: async (): Promise<EtudiantItem[]> => {
      try {
        const response = await apiFetch('/api/sections/securite-configuration/acces/users/select');
        if (!response.ok) return [];

        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        return rows
          .filter((row: any) => row?.category === 'Etudiant')
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



