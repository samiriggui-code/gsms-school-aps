'use client';

import { useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchSectionHubMonthlyEvolution, fetchSectionHubDistribution } from '@/lib/section-hub-stats-client';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface MarketingEvolutionData {
  date: string;
  count: number;
}

const defaultMarketingData = [
  { month: 'Jan', total: 0 },
  { month: 'Feb', total: 0 },
  { month: 'Mar', total: 0 },
  { month: 'Apr', total: 0 },
  { month: 'May', total: 0 },
  { month: 'Jun', total: 0 },
];

export function MarketingEvolutionChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: apiData, isLoading } = useQuery<MarketingEvolutionData[]>(
    {
      queryKey: ['section-hub-evolution', 'marketing', selectedPeriod],
      queryFn: () => fetchSectionHubMonthlyEvolution('marketing', selectedPeriod),
      staleTime: 5 * 60 * 1000,
      enabled: mounted,
    }
  );

  const [chartData, setChartData] = useState(defaultMarketingData);

  useEffect(() => {
    if (apiData && apiData.length > 0) {
      const formattedData = apiData.map(item => ({
        month: new Date(item.date).toLocaleString('default', { month: 'short' }),
        total: item.count
      }));
      setChartData(formattedData);
    } else {
      setChartData(defaultMarketingData);
    }
  }, [apiData, selectedPeriod]);

  const series = [
    {
      name: 'Effectif',
      data: chartData.map(item => item.total),
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 300,
      type: 'area',
      toolbar: {
        show: false,
      },
      fontFamily: 'inherit',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: ['#10b981'],
    xaxis: {
      categories: chartData.map(item => item.month),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: 'var(--color-secondary-foreground)',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: 'var(--color-secondary-foreground)',
          fontSize: '12px',
        },
      },
    },
    tooltip: {
      enabled: true,
      custom({ series, seriesIndex, dataPointIndex, w }) {
        const val = series[seriesIndex][dataPointIndex];
        const label = w.globals.labels[dataPointIndex];

        return `
          <div class="flex flex-col gap-2 p-3.5">
            <div class="font-medium text-sm text-secondary-foreground">Période: ${label}</div>
            <div class="flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-[#10b981]"></span>
              <span class="text-xs text-secondary-foreground">Effectif:</span>
              <div class="font-semibold text-sm text-mono">${val}</div>
            </div>
          </div>
        `;
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100],
      },
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 5,
    },
  };

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed">
        <CardTitle className="text-base font-bold uppercase text-foreground">Évolution de l'Effectif</CardTitle>
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
          <ApexChart
            options={options}
            series={series}
            type="area"
            height={300}
          />
        )}
      </CardContent>
    </Card>
  );
}
