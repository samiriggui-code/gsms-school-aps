'use client';

import { Checkbox } from '@repo/ui/checkbox';
import { Label } from '@repo/ui/label';
import { ScrollArea } from '@repo/ui/scroll-area';

export function RhMetierQualificationPicker({
  presets,
  selected,
  onToggle,
  idPrefix = 'mq',
}: {
  presets: readonly string[];
  selected: string[];
  onToggle: (label: string, checked: boolean) => void;
  idPrefix?: string;
}) {
  const set = new Set(selected);
  return (
    <ScrollArea className="h-[240px] rounded-md border border-border bg-secondary/40 p-3">
      <div className="grid grid-cols-2 gap-2.5 pr-2">
        {presets.map((p, i) => {
          const nid = `${idPrefix}-${i}`;
          return (
            <div key={nid} className="flex items-start gap-2">
              <Checkbox
                id={nid}
                className="mt-0.5"
                checked={set.has(p)}
                onCheckedChange={(c) => onToggle(p, c === true)}
              />
              <Label htmlFor={nid} className="text-sm font-normal leading-snug cursor-pointer">
                {p}
              </Label>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
