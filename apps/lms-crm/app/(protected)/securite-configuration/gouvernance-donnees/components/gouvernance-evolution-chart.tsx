'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type DashboardResponse = {
  monthlyUploads: { date: string; count: number }[];
};

export function GouvernanceEvolutionChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['gouvernance-dashboard-evolution'],
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

  const chartData =
    data?.monthlyUploads.map((item) => ({
      month: new Date(item.date).toLocaleString('fr-FR', { month: 'short' }),
      total: item.count,
    })) ?? [];

  const series = [{ name: 'Dépôts', data: chartData.map((item) => item.total) }];

  const options: ApexOptions = {
    chart: { height: 300, type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 },
    },
    xaxis: { categories: chartData.map((item) => item.month) },
    colors: ['hsl(var(--primary))'],
    grid: { borderColor: 'hsl(var(--border))', strokeDashArray: 4 },
  };

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="border-b border-dashed">
        <CardTitle className="text-base font-bold">Évolution des dépôts (12 mois)</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {!mounted || isLoading ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <ApexChart options={options} series={series} type="area" height={300} width="100%" />
        )}
      </CardContent>
    </Card>
  );
}
