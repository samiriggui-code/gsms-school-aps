'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FormationLibraryApiRow } from '../types/catalog-api';
import { formationsApiQueryOptions } from './formations-api-query-options';

export const formationsLibraryQueryKey = [
  'gestion-academique',
  'vie-scolaire',
  'formations',
  'library',
] as const;

export function useFormationLibraryQuery() {
  return useQuery({
    queryKey: formationsLibraryQueryKey,
    queryFn: async (): Promise<{ items: FormationLibraryApiRow[] }> => {
      const response = await apiFetch(
        '/api/sections/gestion-academique/vie-scolaire/formations/library',
      );
      if (!response.ok) {
        throw new Error('Impossible de charger le référentiel formations.');
      }
      const payload = await response.json();
      if (!payload?.success || !Array.isArray(payload?.data?.items)) {
        throw new Error(payload?.error?.message ?? 'Réponse bibliothèque invalide.');
      }
      return { items: payload.data.items };
    },
    staleTime: 1000 * 60,
    ...formationsApiQueryOptions,
  });
}
