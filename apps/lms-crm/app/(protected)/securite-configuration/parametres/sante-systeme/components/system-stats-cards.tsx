'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@repo/ui/skeleton';
import { Server, Database, Zap, Cpu, Clock, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SystemHealthState = {
  node: {
    memory: { rss: number; heapTotal: number; heapUsed: number };
    uptime: number;
    cpus: number;
  };
  redis: {
    status: string;
    info: { usedMemory: string; connectedClients: string; uptimeDays: string };
  };
  postgres: { status: string; size: string };
};

const iconAccents = [
  { orb: 'bg-sky-500/10', box: 'bg-sky-500/15 border-sky-500/25', icon: 'text-sky-600 dark:text-sky-400' },
  { orb: 'bg-emerald-500/10', box: 'bg-emerald-500/15 border-emerald-500/25', icon: 'text-emerald-600 dark:text-emerald-400' },
  { orb: 'bg-amber-500/10', box: 'bg-amber-500/15 border-amber-500/25', icon: 'text-amber-600 dark:text-amber-400' },
  { orb: 'bg-orange-500/10', box: 'bg-orange-500/15 border-orange-500/25', icon: 'text-orange-600 dark:text-orange-400' },
  { orb: 'bg-violet-500/10', box: 'bg-violet-500/15 border-violet-500/25', icon: 'text-violet-600 dark:text-violet-400' },
];

export function SystemStatsCards() {
  const [data, setData] = useState<SystemHealthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await apiFetch('/api/admin/system-health');
      if (response.ok) {
        const json = await response.json();
        setData(json);
      }
    } catch (error) {
      console.error('Erreur santé système:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const gridClasses = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full';

  if (isLoading && !data) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/70 px-4 py-4">
            <Skeleton className="h-8 w-8 rounded-lg mb-3" />
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: 'Uptime Node.js',
      value: `${Math.floor(data.node.uptime / 3600)}h ${Math.floor((data.node.uptime % 3600) / 60)}m`,
      sub: `Instance ID: ${process.pid}`,
      Icon: Clock,
    },
    {
      label: 'CPU Cores',
      value: String(data.node.cpus),
      sub: 'Instances logiques',
      Icon: Cpu,
    },
    {
      label: 'RAM RSS',
      value: `${data.node.memory.rss} MB`,
      sub: 'Mémoire totale allouée',
      Icon: Server,
    },
    {
      label: 'Redis',
      value: data.redis.info?.usedMemory || 'OFF',
      sub: `${data.redis.info?.connectedClients || 0} clients actifs`,
      Icon: Zap,
    },
    {
      label: 'PostgreSQL',
      value: data.postgres.size,
      sub: data.postgres.status === 'connected' ? 'Base opérationnelle' : 'Erreur connexion',
      Icon: Database,
    },
  ];

  return (
    <div className={gridClasses}>
      {stats.map((tile, index) => {
        const Icon = tile.Icon;
        const accent = iconAccents[index % iconAccents.length];
        return (
          <div
            key={tile.label}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{tile.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{tile.value}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tile.sub}</p>
              </div>
              <div className={cn('size-10 shrink-0 rounded-lg flex items-center justify-center border', accent.box)}>
                <Icon className={cn('size-5', accent.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
