'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type EvolutionPoint = { date: string; count: number };

const buildFallbackTimeline = (months: number) => {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      month: d.toLocaleString('fr-FR', { month: 'short' }),
      total: 0,
    };
  });
};

export function EquipmentEvolutionChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [mounted, setMounted] = useState(false);
  const [chartData, setChartData] = useState(() => buildFallbackTimeline(12));

  useEffect(() => setMounted(true), []);

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['equipment-evolution-stats', selectedPeriod],
    queryFn: async () => {
      const days = Number(selectedPeriod) * 30;
      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/stats?days=${days}`,
      );
      if (!response.ok) throw new Error('Failed to fetch equipment evolution stats');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: mounted,
  });

  useEffect(() => {
    const months = Number(selectedPeriod);
    const evolution: EvolutionPoint[] = statsResponse?.data?.monthlyEvolution || [];
    if (evolution.length > 0) {
      setChartData(
        evolution.map((item) => ({
          month: new Date(item.date).toLocaleString('fr-FR', { month: 'short' }),
          total: item.count ?? 0,
        })),
      );
    } else {
      setChartData(buildFallbackTimeline(months));
    }
  }, [statsResponse, selectedPeriod]);

  const series = [{ name: 'Mouvements', data: chartData.map((item) => item.total) }];
  const options: ApexOptions = {
    chart: { height: 300, type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#10b981'],
    xaxis: {
      categories: chartData.map((item) => item.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: 'var(--color-secondary-foreground)', fontSize: '12px' } },
    },
    yaxis: { labels: { style: { colors: 'var(--color-secondary-foreground)', fontSize: '12px' } } },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] } },
    grid: { borderColor: 'var(--color-border)', strokeDashArray: 5 },
  };

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed">
        <CardTitle className="text-base font-bold uppercase text-foreground">Évolution des mouvements</CardTitle>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32 bg-muted/50 border-dashed font-bold text-2xs uppercase">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1" className="text-2xs font-bold uppercase">1 mois</SelectItem>
            <SelectItem value="3" className="text-2xs font-bold uppercase">3 mois</SelectItem>
            <SelectItem value="6" className="text-2xs font-bold uppercase">6 mois</SelectItem>
            <SelectItem value="12" className="text-2xs font-bold uppercase">12 mois</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <ApexChart options={options} series={series} type="area" height={300} />
        )}
      </CardContent>
    </Card>
  );
}
