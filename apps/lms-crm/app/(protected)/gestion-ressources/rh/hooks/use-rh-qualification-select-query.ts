'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { SchoolInternalServiceFilter } from './use-rh-position-select-query';

export type RhQualificationOption = {
  id: string;
  label: string;
  code: string;
  schoolInternalService?: string;
  sortOrder?: number;
};

export function useRhQualificationSelectQuery(schoolInternalService?: SchoolInternalServiceFilter) {
  return useQuery({
    queryKey: ['rh-qualifications', schoolInternalService ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (schoolInternalService) {
        params.set('schoolInternalService', schoolInternalService);
      }
      const qs = params.toString();
      const res = await apiFetch(
        `/api/sections/gestion-ressources/rh/qualifications${qs ? `?${qs}` : ''}`,
      );
      if (!res.ok) throw new Error('Impossible de charger les qualifications.');
      const json = await res.json();
      const rows = json.data ?? json;
      return (Array.isArray(rows) ? rows : []) as RhQualificationOption[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
