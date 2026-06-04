import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { SectionHubStatsLegacy } from '@/hooks/use-section-hub-stats';

export async function fetchSectionHubStats(
  section: string,
  months: number | string = 12,
): Promise<SectionHubStatsLegacy> {
  const m = Math.max(1, Math.min(24, Number(months) || 12));
  const res = await apiFetch(
    `/api/dashboard/stats?section=${encodeURIComponent(section)}&months=${m}`,
  );
  if (!res.ok) return {};
  const json = await res.json();
  return unwrapSectionApiData<SectionHubStatsLegacy>(json) ?? {};
}

export async function fetchSectionHubMonthlyEvolution(
  section: string,
  months: number | string = 12,
) {
  const data = await fetchSectionHubStats(section, months);
  return data.monthlyEvolution ?? [];
}

export async function fetchSectionHubDistribution(
  section: string,
  months: number | string = 12,
) {
  const data = await fetchSectionHubStats(section, months);
  return data.categoryDistribution ?? [];
}
