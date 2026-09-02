'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Calendar } from '@repo/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { ReportPeriod } from '@repo/report-engine';

export type ReportPeriodValue =
  | { mode: 'preset'; period: Exclude<ReportPeriod, 'custom'> }
  | { mode: 'custom'; start: Date; end: Date };

const PRESETS: { id: Exclude<ReportPeriod, 'custom'>; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Année' },
];

type Props = {
  value: ReportPeriodValue;
  onChange: (v: ReportPeriodValue) => void;
  className?: string;
};

function DateBtn({ date, placeholder, onSelect }: { date?: Date; placeholder: string; onSelect: (d?: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 min-w-[132px] justify-start px-2.5 text-xs font-normal">
          <CalendarIcon className="me-1.5 size-3.5 shrink-0" />
          <span className="truncate">{date ? format(date, 'dd MMM yyyy', { locale: fr }) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} locale={fr} />
      </PopoverContent>
    </Popover>
  );
}

function defaultCustomRange(): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function ReportPeriodRangePicker({ value, onChange, className }: Props) {
  const activeValue = value.mode === 'preset' ? value.period : 'custom';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-x-auto pb-0.5">
        <ToggleGroup
          type="single"
          value={activeValue}
          onValueChange={(v) => {
            if (!v) return;
            if (v === 'custom') {
              onChange({ mode: 'custom', ...defaultCustomRange() });
              return;
            }
            onChange({ mode: 'preset', period: v as Exclude<ReportPeriod, 'custom'> });
          }}
          variant="outline"
          size="sm"
          className="inline-flex h-9 w-max min-w-full flex-nowrap sm:min-w-0"
        >
          {PRESETS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className="shrink-0 flex-none px-3 text-xs whitespace-nowrap">
              {p.label}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem value="custom" className="shrink-0 flex-none px-3 text-xs whitespace-nowrap">
            Personnalisé
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {value.mode === 'custom' ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
          <DateBtn
            date={value.start}
            placeholder="Date de début"
            onSelect={(d) => {
              if (!d || value.mode !== 'custom') return;
              const start = new Date(d);
              start.setHours(0, 0, 0, 0);
              const end = value.end < start ? new Date(start) : value.end;
              if (end.getTime() === value.end.getTime()) {
                onChange({ ...value, start });
              } else {
                end.setHours(23, 59, 59, 999);
                onChange({ mode: 'custom', start, end });
              }
            }}
          />
          <span className="text-xs text-muted-foreground">au</span>
          <DateBtn
            date={value.end}
            placeholder="Date de fin"
            onSelect={(d) => {
              if (!d || value.mode !== 'custom') return;
              const end = new Date(d);
              end.setHours(23, 59, 59, 999);
              const start = value.start > end ? new Date(end) : value.start;
              if (start.getTime() === value.start.getTime()) {
                onChange({ ...value, end });
              } else {
                start.setHours(0, 0, 0, 0);
                onChange({ mode: 'custom', start, end });
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function reportPeriodToApi(value: ReportPeriodValue): {
  period: ReportPeriod;
  customRange?: { start: string; end: string };
} {
  if (value.mode === 'custom') {
    return {
      period: 'custom',
      customRange: {
        start: value.start.toISOString(),
        end: value.end.toISOString(),
      },
    };
  }
  return { period: value.period };
}
