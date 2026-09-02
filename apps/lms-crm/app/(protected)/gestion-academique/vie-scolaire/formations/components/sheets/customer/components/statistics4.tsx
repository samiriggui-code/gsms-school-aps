'use client';

import { Card, CardContent } from '@repo/ui/card';

export function Statistics4({
  age,
  french,
  auth,
  casier,
  ageLegend = 'Âge minimum',
  frenchLegend = 'Niveau français',
  authLegend = 'Autorisation / réf.',
  casierLegend = 'Casier / moralité',
}: {
  age: string;
  french: string;
  auth: string;
  casier: string;
  ageLegend?: string;
  frenchLegend?: string;
  authLegend?: string;
  casierLegend?: string;
}) {
  const items = [
    { total: age, label: ageLegend },
    { total: french, label: frenchLegend },
    { total: auth, label: authLegend },
    { total: casier, label: casierLegend },
  ];

  return (
    <Card className="rounded-md mb-5 bg-accent/70 p-1">
      <CardContent className="rounded-md p-0 bg-background border border-border">
        <div className="grid sm:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col px-4 py-3 ${index > 0 ? 'sm:border-s border-border' : ''}`}
            >
              <span className="text-2xl font-semibold text-foreground">{item.total}</span>
              <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
