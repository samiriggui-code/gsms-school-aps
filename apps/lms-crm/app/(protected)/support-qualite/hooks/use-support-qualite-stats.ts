'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ModuleStatsResponse } from '@repo/api-core';

const FALLBACK_KPIS: ModuleStatsResponse['kpis'] = [
  { label: 'Tickets ouverts', value: 0, color: 'primary', icon: 'MessageSquare', trendValue: '—', trend: 'neutral' },
  { label: 'Résolus', value: 0, color: 'success', icon: 'CheckCircle', trendValue: '—', trend: 'neutral' },
  { label: 'En attente', value: 0, color: 'warning', icon: 'Clock', trendValue: '—', trend: 'neutral' },
  { label: 'Urgents', value: 0, color: 'destructive', icon: 'AlertTriangle', trendValue: '—', trend: 'neutral' },
  { label: 'SLA moyen', value: '—', color: 'info', icon: 'Zap', trendValue: '—', trend: 'neutral' },
];

export function parseSupportQualiteStatsPayload(data: unknown): ModuleStatsResponse {
  const now = new Date().toISOString();
  if (!data || typeof data !== 'object') return { kpis: FALLBACK_KPIS, updatedAt: now };
  const record = data as Record<string, unknown>;
  if (record.success === true && record.data && typeof record.data === 'object') {
    const inner = record.data as ModuleStatsResponse;
    return {
      kpis: inner.kpis?.length ? inner.kpis : FALLBACK_KPIS,
      updatedAt: inner.updatedAt || now,
    };
  }
  if (Array.isArray(record.kpis)) {
    const r = record as unknown as ModuleStatsResponse;
    return { ...r, updatedAt: r.updatedAt || now };
  }
  return { kpis: FALLBACK_KPIS, updatedAt: now };
}

export function useSupportQualiteStats() {
  const query = useQuery({
    queryKey: ['support-qualite-section-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/support-qualite/stats');
      if (!response.ok) throw new Error('stats');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const statsResponse = parseSupportQualiteStatsPayload(query.data);
  const kpis = (query.isError ? FALLBACK_KPIS : statsResponse.kpis || FALLBACK_KPIS).slice(0, 5);

  return { ...query, kpis, statsResponse };
}
