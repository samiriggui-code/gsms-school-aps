'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { formationsApiQueryOptions } from './formations-api-query-options';

export function formationDetailQueryKey(slug: string) {
  return ['gestion-academique', 'vie-scolaire', 'formations', 'detail', slug] as const;
}

/** Détail fusionné référence + offre catalogue (GET slug). */
export type FormationCatalogMergedDetail = Record<string, unknown> & {
  slug?: string;
  name?: string;
  status?: string;
  priceFrom?: number | null;
  currency?: string;
  parcoursSpecialite?: string;
  fundingBlocks?: unknown;
  prerequisitesTable?: unknown;
};

/** Gabarits bruts `Formation` pour menus financement / prérequis (sans surcharges). */
export type FormationCatalogDetailTemplates = {
  fundingBlocks: unknown;
  prerequisitesTable: unknown;
  parcoursSpecialite: string;
};

export function useFormationDetailQuery(slug: string | null, enabled: boolean) {
  return useQuery({
    queryKey: slug ? formationDetailQueryKey(slug) : ['gestion-academique', 'vie-scolaire', 'formations', 'detail', '_'],
    enabled: Boolean(slug && enabled),
    queryFn: async (): Promise<{ item: FormationCatalogMergedDetail; templates: FormationCatalogDetailTemplates }> => {
      const response = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formations/${encodeURIComponent(slug!)}`,
      );
      if (!response.ok) {
        throw new Error('Impossible de charger le détail de la formation.');
      }
      const payload = await response.json();
      if (!payload?.success || !payload?.data?.item) {
        throw new Error(payload?.error?.message ?? 'Réponse détail formation invalide.');
      }
      const templates = payload.data.templates as FormationCatalogDetailTemplates | undefined;
      if (!templates) {
        throw new Error('Réponse détail formation : gabarits référence manquants.');
      }
      return {
        item: payload.data.item as FormationCatalogMergedDetail,
        templates,
      };
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...formationsApiQueryOptions,
  });
}
