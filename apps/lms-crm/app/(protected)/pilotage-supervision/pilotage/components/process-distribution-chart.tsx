'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useModuleWorkspaceQuery } from '@/hooks/use-module-workspace-query';
import {
  moduleDonutCardClass,
  moduleDonutCardFooterClass,
  moduleDonutCardHeaderClass,
} from '../../components/module-chart-card-styles';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SLICE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export function ProcessDistributionChart() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useModuleWorkspaceQuery({
    viewKey: 'pilotage-alertes',
    page: 1,
    limit: 1,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const raw = data?.charts?.distribution ?? [];
  const chartData = raw.length
    ? raw.map((item, index) => ({
        name: item.name,
        value: item.value,
        color: SLICE_COLORS[index % SLICE_COLORS.length],
      }))
    : [{ name: 'Chargement', value: 1, color: '#94a3b8' }];

  const centerTotal = data?.charts?.distributionTotal ?? chartData.reduce((s, d) => s + d.value, 0);

  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: chartData.map((item) => item.name),
    colors: chartData.map((item) => item.color),
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Signaux',
              fontSize: '12px',
              color: '#94a3b8',
              formatter: () => String(centerTotal),
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--color-secondary-foreground)',
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
  };

  if (!mounted || isLoading) {
    return (
      <Card className={moduleDonutCardClass}>
        <CardHeader className={moduleDonutCardHeaderClass}>
          <CardTitle className="text-base font-bold uppercase text-foreground">
            Répartition par module
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-grow items-center justify-center py-6">
          <Skeleton className="size-[250px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={moduleDonutCardClass}>
      <CardHeader className={moduleDonutCardHeaderClass}>
        <CardTitle className="text-base font-bold uppercase text-foreground">
          {data?.charts?.distributionTitle ?? 'Répartition par module'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow items-center justify-center py-6">
        <ApexChart
          options={options}
          series={chartData.map((item) => item.value)}
          type="donut"
          height={320}
          width="100%"
        />
      </CardContent>
      <CardFooter className={moduleDonutCardFooterClass}>
        {chartData.map((item, index) => (
          <div key={index} className="group flex cursor-default items-center gap-2.5">
            <span
              className="size-2.5 rounded-full ring-2 ring-offset-2 ring-transparent transition-all duration-300 group-hover:ring-current"
              style={{ backgroundColor: item.color, color: item.color }}
            />
            <div className="flex flex-col">
              <span className="mb-0.5 text-[10px] font-bold uppercase leading-none tracking-widest text-muted-foreground">
                {item.name}
              </span>
              <span className="text-xs font-bold leading-none text-secondary-foreground">{item.value}</span>
            </div>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}
