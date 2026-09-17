'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  SectionSecurityHighlightsCard,
  type ISecurityHighlightsRow,
  type ISecurityHighlightsItem,
} from '@/components/common/section-security-highlights-card';

type QualiopiBootstrap = {
  summary: { completenessPct: number; status: string };
  items: { status: string }[];
};

const BUCKETS: { key: string; label: string; match: string[]; icon: string; badgeColor: string }[] = [
  { key: 'ok', label: 'Conformes (OK)', match: ['VALIDATED'], icon: 'CheckCircle', badgeColor: 'bg-green-500' },
  { key: 'ko', label: 'Non conformes (KO)', match: ['REJECTED'], icon: 'AlertTriangle', badgeColor: 'bg-red-500' },
  { key: 'fix', label: 'À traiter', match: ['REQUESTED', 'MISSING'], icon: 'Clock', badgeColor: 'bg-indigo-500' },
  { key: 'na', label: 'Non applicables', match: ['WAIVED'], icon: 'ShieldCheck', badgeColor: 'bg-muted-foreground' },
];

export function QualiopiSecurityHighlights() {
  const { data } = useQuery({
    queryKey: ['gestion-ressources', 'qualiopi', 'highlights'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<QualiopiBootstrap>(await res.json());
    },
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const total = items.length || 1;

  const statsData: ISecurityHighlightsRow[] = BUCKETS.map((b) => {
    const count = items.filter((i) => b.match.includes(i.status)).length;
    return {
      icon: b.icon,
      text: b.label,
      total: count,
      stats: Math.round((count / total) * 100),
      trend: b.key === 'ko' && count > 0 ? 'down' : b.key === 'ok' ? 'up' : 'neutral',
    };
  });

  const categories: ISecurityHighlightsItem[] = BUCKETS.map((b) => ({
    badgeColor: b.badgeColor,
    label: b.label,
  }));

  return (
    <SectionSecurityHighlightsCard
      titleKey="sections.qualiopi.securityHighlightsTitle"
      limit={5}
      statsData={statsData}
      overallPerformance={{ value: data?.summary.completenessPct ?? 0, trend: 0 }}
      categories={categories}
    />
  );
}
