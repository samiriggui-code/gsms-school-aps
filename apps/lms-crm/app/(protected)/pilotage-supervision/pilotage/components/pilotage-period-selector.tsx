'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PILOTAGE_PERIOD_OPTIONS, type PilotagePeriod } from '@/lib/pilotage/modules';

type Props = {
  value: PilotagePeriod;
  onChange: (period: PilotagePeriod) => void;
};

export function PilotagePeriodSelector({ value, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as PilotagePeriod);
      }}
      variant="outline"
      size="sm"
      className="h-9 flex-wrap"
    >
      {PILOTAGE_PERIOD_OPTIONS.map((p) => (
        <ToggleGroupItem key={p.id} value={p.id} className="px-3 text-xs">
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
