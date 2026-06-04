'use client';

import { Card, CardContent } from '@/components/ui/card';

export function Statistics2({
  uvCount,
  volumeLabel,
  theoryLabel,
  practiceLabel,
  unitsLegend = "Nombre d'unités",
  volumeLegend = 'Volume horaire',
  theoryLegend = 'Théorie',
  practiceLegend = 'Pratique',
}: {
  uvCount: string;
  volumeLabel: string;
  theoryLabel: string;
  practiceLabel: string;
  unitsLegend?: string;
  volumeLegend?: string;
  theoryLegend?: string;
  practiceLegend?: string;
}) {
  const items = [
    { total: uvCount, label: unitsLegend },
    { total: volumeLabel, label: volumeLegend },
    { total: theoryLabel, label: theoryLegend },
    { total: practiceLabel, label: practiceLegend },
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
