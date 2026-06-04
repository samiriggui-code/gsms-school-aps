'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useModuleWorkspaceQuery } from '@/hooks/use-module-workspace-query';
import { moduleAreaCardClass, moduleAreaCardHeaderClass } from '../../components/module-chart-card-styles';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export function PilotageChart() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useModuleWorkspaceQuery({
    viewKey: 'pilotage-indicateurs',
    page: 1,
    limit: 1,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const evolution = data?.charts?.evolution ?? [];
  const seriesName = data?.charts?.evolutionSeriesName ?? 'Sessions';

  const options: ApexOptions = {
    series: [
      {
        name: seriesName,
        data: evolution.map((item) => item.value),
      },
    ],
    chart: {
      height: 300,
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
    colors: ['#6366F1'],
    xaxis: {
      categories: evolution.map((item) => item.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 } },
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 } },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 4,
      padding: { left: 12, right: 12 },
    },
    tooltip: { theme: 'dark' },
  };

  if (!mounted || isLoading) {
    return (
      <Card className={moduleAreaCardClass}>
        <CardHeader className={moduleAreaCardHeaderClass}>
          <CardTitle className="text-base font-bold uppercase text-foreground">
            Évolution pédagogique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={moduleAreaCardClass}>
      <CardHeader className={moduleAreaCardHeaderClass}>
        <CardTitle className="text-base font-bold uppercase text-foreground">
          {data?.charts?.evolutionTitle ?? 'Évolution pédagogique'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ApexChart options={options} series={options.series} type="area" height={300} />
      </CardContent>
    </Card>
  );
}
