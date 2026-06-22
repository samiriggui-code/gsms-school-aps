'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { dedupeRhPositionOptions } from '@/lib/rh-metier-referential';

export type RhPositionOption = {
  id: string;
  label: string;
  code: string | null;
  schoolInternalService?: string | null;
  sortOrder?: number;
};

export type SchoolInternalServiceFilter =
  | 'DIRECTION'
  | 'PEDAGOGICAL'
  | 'HR_ADMIN'
  | 'TRAINER_POOL'
  | null
  | undefined;

export function useRhPositionSelectQuery(schoolInternalService?: SchoolInternalServiceFilter) {
  return useQuery({
    queryKey: ['rh-positions', schoolInternalService ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (schoolInternalService) {
        params.set('schoolInternalService', schoolInternalService);
      }
      const qs = params.toString();
      const res = await apiFetch(
        `/api/sections/gestion-ressources/rh/positions${qs ? `?${qs}` : ''}`,
      );
      if (!res.ok) throw new Error('Impossible de charger les postes.');
      const json = await res.json();
      const rows = json.data ?? json;
      const list = (Array.isArray(rows) ? rows : []) as RhPositionOption[];
      return dedupeRhPositionOptions(list);
    },
    staleTime: 1000 * 60 * 30,
  });
}
