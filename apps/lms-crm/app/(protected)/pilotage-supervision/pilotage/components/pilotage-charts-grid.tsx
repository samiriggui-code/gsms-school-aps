'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PilotageDistributionSlice, PilotageChartPoint } from '@repo/api-core';
import {
  moduleAreaCardClass,
  moduleAreaCardHeaderClass,
  moduleDonutCardClass,
  moduleDonutCardFooterClass,
  moduleDonutCardHeaderClass,
} from '@/app/(protected)/pilotage-supervision/components/module-chart-card-styles';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const SLICE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type ChartBundle = {
  distributionTitle: string;
  evolutionTitle: string;
  evolutionSeriesName: string;
  distribution: PilotageDistributionSlice[];
  distributionTotal: number;
  evolution: PilotageChartPoint[];
};

type Props = {
  primary: ChartBundle;
  secondary?: {
    title: string;
    distribution: PilotageDistributionSlice[];
  };
  isLoading?: boolean;
};

export function PilotageChartsGrid({ primary, secondary, isLoading }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (isLoading || !mounted) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <Skeleton className="h-[380px] rounded-xl lg:col-span-1" />
        <Skeleton className="h-[380px] rounded-xl lg:col-span-2" />
      </div>
    );
  }

  const distribution = primary.distribution.length ? primary.distribution : [{ name: '—', value: 0 }];
  const evolution = primary.evolution.length ? primary.evolution : [{ label: '—', value: 0 }];
  const centerTotal = primary.distributionTotal || distribution.reduce((s, d) => s + d.value, 0);

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
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
  };

  const areaOptions: ApexOptions = {
    chart: { height: 300, type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
    series: [{ name: primary.evolutionSeriesName, data: evolution.map((p) => p.value) }],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: ['#6366f1'],
    xaxis: {
      categories: evolution.map((p) => p.label),
      labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.04, stops: [0, 90, 100] },
    },
    grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' },
  };

  const secondarySlices = secondary?.distribution?.length
    ? secondary.distribution
    : [{ name: '—', value: 0 }];

  const secondaryDonut: ApexOptions = {
    ...donutOptions,
    labels: secondarySlices.map((d) => d.name),
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => String(secondarySlices.reduce((s, d) => s + d.value, 0)),
            },
          },
        },
      },
    },
  };

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <Card className={moduleDonutCardClass}>
          <CardHeader className={moduleDonutCardHeaderClass}>
            <CardTitle className="text-center text-base font-bold uppercase">{primary.distributionTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-6">
            <ApexChart
              options={donutOptions}
              series={distribution.map((d) => d.value)}
              type="donut"
              height={280}
              width="100%"
            />
          </CardContent>
          <CardFooter className={moduleDonutCardFooterClass}>
            {distribution.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
                />
                <span className="text-2xs font-bold uppercase text-muted-foreground">
                  {item.name}
                  <span className="ms-1 rounded border border-border bg-background px-1.5 py-0.5 text-primary">
                    {item.value}
                  </span>
                </span>
              </div>
            ))}
          </CardFooter>
        </Card>

        <Card className={`${moduleAreaCardClass} lg:col-span-2`}>
          <CardHeader className={moduleAreaCardHeaderClass}>
            <CardTitle className="text-base font-bold uppercase">{primary.evolutionTitle}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ApexChart options={areaOptions} series={areaOptions.series} type="area" height={300} />
          </CardContent>
        </Card>
      </div>

      {secondary ? (
        <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:gap-8">
          <Card className={moduleDonutCardClass}>
            <CardHeader className={moduleDonutCardHeaderClass}>
              <CardTitle className="text-center text-base font-bold uppercase">{secondary.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
              <ApexChart
                options={secondaryDonut}
                series={secondarySlices.map((d) => d.value)}
                type="donut"
                height={260}
                width="100%"
              />
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wide">Sections clés</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Indicateurs consolidés pour anticiper la charge RH, le parc matériel et les salles.
              Les autres modules (vie scolaire, finance) seront ajoutés via les onglets sans changer de page.
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
