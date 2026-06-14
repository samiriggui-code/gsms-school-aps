'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PILOTAGE_PERIOD_OPTIONS, type PilotagePeriod } from '@/lib/pilotage/modules';

type Props = {
  value: PilotagePeriod;
  onChange: (period: PilotagePeriod) => void;
};

export function PilotagePeriodSelector({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as PilotagePeriod)}>
      <TabsList className="h-9">
        {PILOTAGE_PERIOD_OPTIONS.map((p) => (
          <TabsTrigger key={p.id} value={p.id} className="text-xs px-3">
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
