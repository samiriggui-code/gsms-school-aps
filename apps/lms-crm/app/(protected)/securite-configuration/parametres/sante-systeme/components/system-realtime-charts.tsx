'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { apiFetch } from '@/lib/api';
import { Activity, Loader2 } from 'lucide-react';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MAX_POINTS = 20;

export function SystemRealtimeCharts() {
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<{
    timestamps: string[];
    cpu: number[];
    heap: number[];
    rss: number[];
  }>({
    timestamps: [],
    cpu: [],
    heap: [],
    rss: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    const fetchData = async () => {
      try {
        const res = await apiFetch('/api/admin/system-health');
        if (res.ok) {
          const data = await res.json();
          const now = new Date().toLocaleTimeString('fr-FR', { hour12: false });
          
          setHistory(prev => {
            const newTimestamps = [...prev.timestamps, now].slice(-MAX_POINTS);
            const newCpu = [...prev.cpu, data.node.cpuUsage].slice(-MAX_POINTS);
            const newHeap = [...prev.heap, data.node.memory.heapUsed].slice(-MAX_POINTS);
            const newRss = [...prev.rss, data.node.memory.rss].slice(-MAX_POINTS);
            
            return {
              timestamps: newTimestamps,
              cpu: newCpu,
              heap: newHeap,
              rss: newRss
            };
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Realtime chart fetch error:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const series = [
    {
      name: 'CPU Usage (%)',
      data: history.cpu,
    },
    {
      name: 'Heap Used (MB)',
      data: history.heap,
    },
    {
      name: 'RSS Memory (MB)',
      data: history.rss,
    }
  ];

  const options: ApexOptions = {
    chart: {
      id: 'system-realtime',
      type: 'area',
      height: 350,
      animations: {
        enabled: true,
        // @ts-expect-error - easing is missing in ApexCharts types but supported at runtime
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: [3, 2, 2],
    },
    colors: ['#ef4444', '#6366f1', '#10b981'], // Red, Blue, Green
    xaxis: {
      categories: history.timestamps,
      labels: {
        style: {
          fontSize: '10px',
          colors: 'var(--color-secondary-foreground)'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '10px',
          colors: 'var(--color-secondary-foreground)'
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontWeight: 600,
      labels: {
        colors: 'var(--color-foreground)'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark'
    }
  };

  return (
    <Card className="border-dashed shadow-none bg-card/50">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-dashed pb-4">
        <div className="p-2 rounded-lg border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400">
          <Activity className="size-4" />
        </div>
        <CardTitle className="text-sm font-bold uppercase tracking-widest">Usage Multi-Spectres Temps Réel</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading && history.timestamps.length === 0 ? (
          <div className="flex items-center justify-center h-[350px]">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <ApexChart
            options={options}
            series={series}
            type="area"
            height={350}
          />
        )}
      </CardContent>
    </Card>
  );
}
