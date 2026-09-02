'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export function IncidentDistributionChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['incident-distribution'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/support-qualite/support/incidents?limit=200');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return [];
      const payload = unwrapSectionApiData<{ items: { severity: string }[] }>(json);
      const counts: Record<string, number> = {};
      for (const item of payload?.items ?? []) {
        counts[item.severity] = (counts[item.severity] ?? 0) + 1;
      }
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    staleTime: 60_000,
  });

  const options: ApexOptions = {
    chart: { type: 'donut' },
    labels: data?.map((d) => d.name) ?? [],
    colors: data?.map((d) => SEVERITY_COLORS[d.name] ?? '#6366f1') ?? [],
    legend: { position: 'bottom' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition par gravité</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Répartition par gravité</CardTitle>
      </CardHeader>
      <CardContent>
        <ApexChart options={options} series={data?.map((d) => d.value) ?? []} type="donut" height={260} />
      </CardContent>
    </Card>
  );
}

export function IncidentEvolutionChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['incident-evolution'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/support-qualite/support/incidents?limit=200');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { categories: [], series: [] };
      const payload = unwrapSectionApiData<{ items: { createdAt: string }[] }>(json);
      const buckets = new Map<string, number>();
      for (const item of payload?.items ?? []) {
        const d = new Date(item.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      const sorted = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
      return {
        categories: sorted.map(([k]) => k),
        series: [{ name: 'Incidents', data: sorted.map(([, v]) => v) }],
      };
    },
    staleTime: 60_000,
  });

  const options: ApexOptions = {
    chart: { type: 'area', toolbar: { show: false } },
    xaxis: { categories: data?.categories ?? [] },
    stroke: { curve: 'smooth' },
    dataLabels: { enabled: false },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Évolution mensuelle</CardTitle>
      </CardHeader>
      <CardContent>
        <ApexChart options={options} series={data?.series ?? []} type="area" height={260} />
      </CardContent>
    </Card>
  );
}
