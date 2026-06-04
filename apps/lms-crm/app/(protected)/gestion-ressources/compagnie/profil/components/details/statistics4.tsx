'use client';

import { Card, CardContent } from '@/components/ui/card';

export function Statistics4({
  total,
  paid,
  open,
  overdue,
}: {
  total?: number;
  paid?: number;
  open?: number;
  overdue?: number;
}) {
  const formatCount = (value?: number) =>
    new Intl.NumberFormat('fr-FR').format(value ?? 0);

  const items = [
    { value: formatCount(total), label: 'Total factures' },
    { value: formatCount(paid), label: 'Payées' },
    { value: formatCount(open), label: 'En attente' },
    { value: formatCount(overdue), label: 'En retard' },
  ];

  return (
    <Card className="rounded-xl border border-border/60 bg-background shadow-none">
      <CardContent className="p-0">
        <div className="grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {items.map((item, index) => (
            <div key={index} className="px-5 py-4 space-y-1">
              <div className="text-2xl font-semibold text-foreground">
                {item.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
