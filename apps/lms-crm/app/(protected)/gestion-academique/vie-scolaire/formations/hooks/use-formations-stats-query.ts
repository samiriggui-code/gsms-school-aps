'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FormationCatalogStatsApi } from '../types/catalog-api';
import { formationsApiQueryOptions } from './formations-api-query-options';

export const formationsStatsQueryKey = [
  'gestion-academique',
  'vie-scolaire',
  'formations',
  'stats',
] as const;

export function useFormationsStatsQuery() {
  return useQuery({
    queryKey: formationsStatsQueryKey,
    queryFn: async (): Promise<FormationCatalogStatsApi> => {
      const response = await apiFetch(
        '/api/sections/gestion-academique/vie-scolaire/formations/stats',
      );
      if (!response.ok) {
        throw new Error('Échec du chargement des statistiques formations.');
      }
      const payload = await response.json();
      if (!payload?.success || !payload?.data) {
        throw new Error(payload?.error?.message ?? 'Réponse statistiques invalide.');
      }
      return payload.data as FormationCatalogStatsApi;
    },
    staleTime: 1000 * 60 * 2,
    ...formationsApiQueryOptions,
  });
}
