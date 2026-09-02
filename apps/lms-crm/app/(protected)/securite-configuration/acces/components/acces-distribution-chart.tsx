'use client';

import { Fragment, useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@repo/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchSectionHubStats } from '@/lib/section-hub-stats-client';
import { Skeleton } from '@repo/ui/skeleton';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

export function RHDistributionChart() {
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['section-hub-distribution', 'securite'],
    queryFn: () => fetchSectionHubStats('securite', 12),
    staleTime: 2 * 60 * 1000,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categoryDistribution = statsResponse?.categoryDistribution ?? [];
  
  const chartData: ChartItem[] = categoryDistribution.map((item: any, index: number) => ({
    name: item.name,
    value: item.count,
    color: COLORS[index % COLORS.length]
  }));

  const activeEmployees = statsResponse?.activeCollaborators ?? 0;

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
    },
    labels: chartData.map((item: ChartItem) => item.name),
    colors: chartData.map((item: ChartItem) => item.color),
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Agents',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-muted-foreground)',
              formatter: () => `${activeEmployees}`,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-secondary-foreground)',
              offsetY: 5,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      show: false,
    },
    tooltip: {
      enabled: true,
      custom({ series, seriesIndex, w }) {
        const val = series[seriesIndex];
        const label = w.globals.labels[seriesIndex];
        const color = w.globals.colors[seriesIndex];

        return `
          <div class="flex flex-col gap-2 p-3.5">
            <div class="flex items-center gap-1.5">
              <span class="size-2 rounded-full" style="background-color: ${color}"></span>
              <span class="text-xs text-secondary-foreground">${label}:</span>
              <div class="font-semibold text-sm text-mono">${val}</div>
            </div>
          </div>
        `;
      },
    },
  };

  const series = chartData.map(item => item.value);

  if (!mounted || isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-mono text-center">Répartition des Effectifs</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <Skeleton className="h-[250px] w-[250px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-dashed">
      <CardHeader className="border-b border-dashed">
        <CardTitle className="text-base font-bold uppercase text-foreground text-center">Répartition des Effectifs</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center p-6">
        <ApexChart
          options={options}
          series={series}
          type="donut"
          height={320}
          width="100%"
        />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 p-5 border-t border-dashed bg-muted/30">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span 
              className="size-2 rounded-full shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-2xs font-bold text-muted-foreground uppercase tracking-tight">
              {item.name} 
              <span className="text-2xs text-primary font-bold ml-1.5 bg-background border border-border px-1.5 py-0.5 rounded shadow-sm">
                {item.value}
              </span>
            </span>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}
