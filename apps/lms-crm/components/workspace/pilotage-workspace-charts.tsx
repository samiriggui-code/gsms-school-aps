'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';
import type { WorkspaceCharts } from '@repo/api-core';
import {
  moduleAreaCardClass,
  moduleAreaCardHeaderClass,
  moduleDonutCardClass,
  moduleDonutCardFooterClass,
  moduleDonutCardHeaderClass,
} from '@/app/(protected)/pilotage-supervision/components/module-chart-card-styles';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SLICE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type Props = {
  charts?: WorkspaceCharts;
  isLoading?: boolean;
};

export function PilotageWorkspaceCharts({ charts, isLoading }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !mounted) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <Skeleton className="h-[380px] w-full rounded-xl lg:col-span-1" />
        <Skeleton className="h-[380px] w-full rounded-xl lg:col-span-2" />
      </div>
    );
  }

  const distribution = charts?.distribution?.length
    ? charts.distribution
    : [{ name: 'Aucune donnée', value: 1 }];
  const evolution = charts?.evolution?.length ? charts.evolution : [{ label: '—', value: 0 }];
  const centerTotal = charts?.distributionTotal ?? distribution.reduce((s, d) => s + d.value, 0);

  const donutOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: distribution.map((d) => d.name),
    colors: distribution.map((_, i) => SLICE_COLORS[i % SLICE_COLORS.length]),
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              color: 'var(--color-muted-foreground)',
              formatter: () => String(centerTotal),
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-foreground)',
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
  };

  const areaOptions: ApexOptions = {
    chart: {
      height: 300,
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    series: [
      {
        name: charts?.evolutionSeriesName ?? 'Valeur',
        data: evolution.map((p) => p.value),
      },
    ],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: ['#6366f1'],
    xaxis: {
      categories: evolution.map((p) => p.label),
      labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.04,
        stops: [0, 90, 100],
      },
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 4,
    },
    tooltip: { theme: 'dark' },
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
      <Card className={moduleDonutCardClass}>
        <CardHeader className={moduleDonutCardHeaderClass}>
          <CardTitle className="text-center text-base font-bold uppercase text-foreground">
            {charts?.distributionTitle ?? 'Répartition'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <ApexChart
            options={donutOptions}
            series={distribution.map((d) => d.value)}
            type="donut"
            height={300}
            width="100%"
          />
        </CardContent>
        <CardFooter className={moduleDonutCardFooterClass}>
          {distribution.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
              />
              <span className="text-2xs font-bold uppercase tracking-tight text-muted-foreground">
                {item.name}
                <span className="ms-1.5 rounded border border-border bg-background px-1.5 py-0.5 text-2xs font-bold text-primary shadow-sm">
                  {item.value}
                </span>
              </span>
            </div>
          ))}
        </CardFooter>
      </Card>

      <Card className={`${moduleAreaCardClass} lg:col-span-2`}>
        <CardHeader className={moduleAreaCardHeaderClass}>
          <CardTitle className="text-base font-bold uppercase text-foreground">
            {charts?.evolutionTitle ?? 'Évolution'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ApexChart options={areaOptions} series={areaOptions.series} type="area" height={300} />
        </CardContent>
      </Card>
    </div>
  );
}
