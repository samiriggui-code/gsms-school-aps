'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export const useSubcontractorSelectQuery = () => {
  return useQuery({
    queryKey: ['subcontractors-select'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/partenaires/prestataires?type=SUBCONTRACTOR&limit=100');
      if (!response.ok) throw new Error('Failed to fetch subcontractors');
      const json = await response.json();
      return json.data as any[];
    },
  });
};
