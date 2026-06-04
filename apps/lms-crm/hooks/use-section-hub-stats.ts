'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export type SectionHubStatsLegacy = {
  totalCollaborators?: number;
  activeCollaborators?: number;
  absentCollaborators?: number;
  complianceRate?: number;
  complianceIssues?: number;
  categoryDistribution?: { name: string; count: number }[];
  monthlyEvolution?: { date: string; count: number }[];
};

export function useSectionHubStats(section: string, months = 12) {
  return useQuery({
    queryKey: ['section-hub-stats', section, months],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/dashboard/stats?section=${encodeURIComponent(section)}&months=${months}`,
      );
      if (!res.ok) return {} as SectionHubStatsLegacy;
      const json = await res.json();
      return unwrapSectionApiData<SectionHubStatsLegacy>(json) ?? {};
    },
    staleTime: 2 * 60 * 1000,
  });
}
