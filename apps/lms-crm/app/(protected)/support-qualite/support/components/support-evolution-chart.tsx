'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function SupportEvolutionChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['support-ticket-evolution'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/support-qualite/support/tickets?limit=200');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { categories: [] as string[], series: [{ name: 'Tickets', data: [] as number[] }] };
      const payload = unwrapSectionApiData<{ items: { createdAt: string }[] }>(json);
      const buckets = new Map<string, number>();
      for (const item of payload?.items ?? []) {
        const d = new Date(item.createdAt);
        const key = d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      const sorted = Array.from(buckets.entries());
      return {
        categories: sorted.map(([k]) => k),
        series: [{ name: 'Tickets créés', data: sorted.map(([, v]) => v) }],
      };
    },
    staleTime: 60_000,
    enabled: mounted,
  });

  const options: ApexOptions = {
    chart: { height: 300, type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#6366f1'],
    xaxis: {
      categories: data?.categories ?? [],
      labels: { style: { colors: 'var(--color-secondary-foreground)', fontSize: '12px' } },
    },
    yaxis: { labels: { style: { colors: 'var(--color-secondary-foreground)', fontSize: '12px' } } },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] },
    },
    grid: { borderColor: 'var(--color-border)', strokeDashArray: 5 },
  };

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="border-b border-dashed">
        <CardTitle className="text-base font-bold uppercase text-foreground">
          Évolution des tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <ApexChart options={options} series={data?.series ?? []} type="area" height={300} />
        )}
      </CardContent>
    </Card>
  );
}
