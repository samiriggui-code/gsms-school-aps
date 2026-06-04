'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { formationsApiQueryOptions } from './formations-api-query-options';

export function formationReferenceTemplatesQueryKey(formationId: string) {
  return ['gestion-academique', 'vie-scolaire', 'formations', 'reference-templates', formationId] as const;
}

export type FormationReferenceTemplates = {
  formationId: string;
  fundingBlocks: unknown;
  prerequisitesTable: unknown;
  parcoursSpecialite: string;
  /** Indication effectif (référence métier), même écran que gabarits financement ; inféré si scalaires DB vides. */
  traineesMin: number;
  traineesMax: number;
};

export function useFormationReferenceTemplatesQuery(formationId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: formationId
      ? formationReferenceTemplatesQueryKey(formationId)
      : ['gestion-academique', 'vie-scolaire', 'formations', 'reference-templates', '_'],
    enabled: Boolean(formationId && enabled),
    queryFn: async (): Promise<FormationReferenceTemplates> => {
      const response = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formations/reference/${encodeURIComponent(
          formationId!,
        )}/defaults`,
      );
      if (!response.ok) {
        throw new Error('Impossible de charger les options définies sur la fiche formation.');
      }
      const payload = await response.json();
      if (!payload?.success || !payload?.data) {
        throw new Error(payload?.error?.message ?? 'Réponse gabarits formation invalide.');
      }
      return payload.data as FormationReferenceTemplates;
    },
    staleTime: 1000 * 60,
    ...formationsApiQueryOptions,
  });
}
