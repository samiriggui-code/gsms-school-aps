'use client';

import { TrendingUp, Clock, ShieldCheck, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function UserStatistics({ user }: { user: { id?: string } }) {
  void user;
  const items = [
    {
      total: '94%',
      label: 'Score Moyen',
      badgeLabel: 'Excellence',
      badgeColor: 'success' as const,
      text: 'Performance globale',
      icon: <ShieldCheck className="size-3" />,
    },
    {
      total: '12',
      label: 'Certifications',
      badgeLabel: '+2',
      badgeColor: 'primary' as const,
      text: 'Ce trimestre',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: '28',
      label: 'Cours terminés',
      badgeLabel: 'Active',
      badgeColor: 'success' as const,
      text: 'Sur 32 assignés',
      icon: <Activity className="size-3" />,
    },
    {
      total: '458h',
      label: 'Temps de formation',
      badgeLabel: '12h',
      badgeColor: 'primary' as const,
      text: 'Moyenne mensuelle',
      icon: <Clock className="size-3" />,
    },
  ];

  return (
    <Card className="mb-5 rounded-md bg-accent/70 p-1">
      <CardContent className="rounded-md border border-border bg-background p-0">
        <div className="divide-y divide-border lg:grid lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col justify-between gap-4 p-4 sm:gap-5 sm:p-4.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-semibold text-foreground sm:text-2xl">{item.total}</span>
                <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
              </div>
              <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
                <Badge variant={item.badgeColor} size="sm" appearance="light" className="w-fit">
                  {item.icon} {item.badgeLabel}
                </Badge>
                <span className="text-xs font-normal text-secondary-foreground">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
