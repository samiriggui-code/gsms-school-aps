'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@repo/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/skeleton';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouverts',
  IN_PROGRESS: 'En cours',
  WAITING_CLIENT: 'Attente client',
  RESOLVED: 'Résolus',
  CLOSED: 'Clôturés',
};

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981', '#94a3b8'];

export function SupportDistributionChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['support-ticket-status-distribution'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/support-qualite/support/tickets?limit=200');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return [];
      const payload = unwrapSectionApiData<{ items: { status: string }[] }>(json);
      const counts: Record<string, number> = {};
      for (const item of payload?.items ?? []) {
        counts[item.status] = (counts[item.status] ?? 0) + 1;
      }
      return Object.entries(counts).map(([status, value], index) => ({
        name: STATUS_LABEL[status] ?? status,
        value,
        color: COLORS[index % COLORS.length],
      }));
    },
    staleTime: 60_000,
  });

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

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
              label: 'Tickets',
              fontSize: '14px',
              formatter: () => `${total}`,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
  };

  if (!mounted || isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-center">Tickets par statut</CardTitle>
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
        <CardTitle className="text-base font-bold uppercase text-foreground text-center">
          Tickets par statut
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center p-6">
        <ApexChart options={options} series={chartData.map((d) => d.value)} type="donut" height={320} width="100%" />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 p-5 border-t border-dashed bg-muted/30">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-2xs font-bold text-muted-foreground uppercase">
              {item.name}
              <span className="text-primary font-bold ml-1.5 bg-background border border-border px-1.5 py-0.5 rounded">
                {item.value}
              </span>
            </span>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}
