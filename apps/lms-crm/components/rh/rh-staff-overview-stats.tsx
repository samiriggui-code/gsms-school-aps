'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { User as Collaborateur } from '@/app/models/user';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function RhStaffOverviewStats({ collaborateur }: { collaborateur: Collaborateur }) {
  const items = [
    {
      total: collaborateur._count?.journalEntries?.toString() || '0',
      label: 'Actions totales',
      badgeLabel: '23.08',
      badgeColor: 'success' as const,
      text: 'Tendance annuelle',
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: collaborateur._count?.shifts?.toString() || '0',
      label: 'Missions effectuées',
      badgeLabel: '3.82',
      badgeColor: 'success' as const,
      text: 'Total planning',
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: collaborateur.status === 'ACTIVE' ? '92' : '45',
      label: 'Score fiabilité',
      badgeLabel: '0.39',
      badgeColor: collaborateur.status === 'ACTIVE' ? ('success' as const) : ('destructive' as const),
      text: 'Basé sur activité',
      number: '%',
      icon:
        collaborateur.status === 'ACTIVE' ?
          <TrendingUp className="size-3" />
        : <TrendingDown className="size-3" />,
    },
    {
      total: collaborateur._count?.absences?.toString() || '0',
      label: 'Absences totales',
      badgeLabel: '0',
      badgeColor: (collaborateur._count?.absences || 0) > 2 ? ('destructive' as const) : ('success' as const),
      text: 'Historique RH',
      number: '',
      icon:
        (collaborateur._count?.absences || 0) > 2 ?
          <TrendingUp className="size-3" />
        : <TrendingDown className="size-3" />,
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-5">
      {items.map((item, index) => (
        <Card
          key={index}
          className="border border-border/50 bg-background shadow-none transition-all duration-300 hover:border-border"
        >
          <CardContent className="flex h-full flex-col justify-between p-3.5 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
              <div className="min-w-0 flex flex-col">
                <span className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:tracking-widest">
                  {item.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {item.total}
                  </span>
                  {item.number ?
                    <span className="text-sm font-semibold text-muted-foreground/60">{item.number}</span>
                  : null}
                </div>
              </div>
              <div className="shrink-0 rounded-lg border border-border/50 bg-background p-2 text-foreground/70">
                {item.icon}
              </div>
            </div>

            <div className="mt-auto flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <Badge
                variant="outline"
                size="sm"
                className="border-border px-1.5 py-0 text-[10px] font-bold text-foreground/70"
              >
                {item.badgeColor === 'success' ? '+' : ''}
                {item.badgeLabel}%
              </Badge>
              <span className="text-[11px] font-medium text-muted-foreground">{item.text}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
