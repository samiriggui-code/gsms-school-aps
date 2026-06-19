'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#64748b'];

type DashboardResponse = {
  stats: { filesActive: number };
  moduleDistribution: { name: string; count: number }[];
};

export function GouvernanceDistributionChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['gouvernance-dashboard-distribution'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/securite-configuration/gouvernance-donnees/dashboard',
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Dashboard load failed');
      return unwrapSectionApiData<DashboardResponse>(json);
    },
    staleTime: 60_000,
    enabled: mounted,
  });

  const chartData = (data?.moduleDistribution ?? []).map((item, index) => ({
    name: item.name,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: chartData.map((item) => item.name),
    colors: chartData.map((item) => item.color),
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Fichiers',
              formatter: () => String(data?.stats.filesActive ?? 0),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
  };

  const series = chartData.map((item) => item.value);

  if (!mounted || isLoading) {
    return (
      <Card className="h-full border-dashed">
        <CardHeader className="border-b border-dashed">
          <CardTitle className="text-base font-bold">Répartition par module</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="mx-auto size-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col border-dashed">
      <CardHeader className="border-b border-dashed">
        <CardTitle className="text-base font-bold text-center">Répartition par module</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow items-center justify-center p-4">
        {chartData.length > 0 ? (
          <ApexChart options={options} series={series} type="donut" height={280} width="100%" />
        ) : (
          <p className="text-sm text-muted-foreground">Aucun fichier actif.</p>
        )}
      </CardContent>
      {chartData.length > 0 ? (
        <CardFooter className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-dashed bg-muted/30 p-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-2xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
              <span className="rounded border bg-background px-1.5 py-0.5 font-bold text-primary">
                {item.value}
              </span>
            </div>
          ))}
        </CardFooter>
      ) : null}
    </Card>
  );
}
