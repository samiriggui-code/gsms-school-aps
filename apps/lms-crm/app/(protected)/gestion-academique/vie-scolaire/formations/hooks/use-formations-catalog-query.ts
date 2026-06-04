'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FormationCatalogApiRow } from '../types/catalog-api';
import { formationsApiQueryOptions } from './formations-api-query-options';

/** Préfixe query : invalider tout le cache catalogue (toutes vues). */
export const formationsCatalogQueryRoot = [
  'gestion-academique',
  'vie-scolaire',
  'formations',
  'catalog',
] as const;

/** `visible` : actives + brouillons (hors suspendues). `archived` : uniquement suspendues. */
export type FormationsCatalogScope = 'visible' | 'archived';

export function formationsCatalogQueryKey(scope: FormationsCatalogScope) {
  return [...formationsCatalogQueryRoot, scope] as const;
}

export function useFormationsCatalogQuery(scope: FormationsCatalogScope = 'visible') {
  return useQuery({
    queryKey: formationsCatalogQueryKey(scope),
    queryFn: async (): Promise<{ items: FormationCatalogApiRow[] }> => {
      const qs = new URLSearchParams({ scope });
      const response = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formations?${qs.toString()}`,
      );
      if (!response.ok) {
        throw new Error('Échec du chargement du catalogue formations.');
      }
      const payload = await response.json();
      if (!payload?.success || !payload?.data?.items) {
        throw new Error(payload?.error?.message ?? 'Réponse catalogue invalide.');
      }
      return { items: payload.data.items };
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...formationsApiQueryOptions,
  });
}
