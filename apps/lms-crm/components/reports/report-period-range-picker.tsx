'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ReportPeriod } from '@repo/report-engine';

export type ReportPeriodValue =
  | { mode: 'preset'; period: Exclude<ReportPeriod, 'custom'> }
  | { mode: 'custom'; start: Date; end: Date };

const PRESETS: { id: Exclude<ReportPeriod, 'custom'>; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
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
        <Button variant="outline" className="h-9 w-[140px] justify-start text-xs font-normal">
          <CalendarIcon className="me-2 size-3.5" />
          {date ? format(date, 'dd MMM yyyy', { locale: fr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} locale={fr} />
      </PopoverContent>
    </Popover>
  );
}

export function ReportPeriodRangePicker({ value, onChange, className }: Props) {
  const preset = value.mode === 'preset' ? value.period : 'custom';

  const customLabel = useMemo(() => {
    if (value.mode !== 'custom') return 'Personnalisé';
    return `${format(value.start, 'dd/MM/yy')} — ${format(value.end, 'dd/MM/yy')}`;
  }, [value]);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Tabs
        value={preset}
        onValueChange={(v) => {
          if (v === 'custom') {
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            const start = new Date(end);
            start.setMonth(start.getMonth() - 1);
            start.setHours(0, 0, 0, 0);
            onChange({ mode: 'custom', start, end });
          } else {
            onChange({ mode: 'preset', period: v as Exclude<ReportPeriod, 'custom'> });
          }
        }}
      >
        <TabsList className="h-9">
          {PRESETS.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="px-3 text-xs">
              {p.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="custom" className="px-3 text-xs">
            {customLabel}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {value.mode === 'custom' ? (
        <div className="flex items-center gap-2">
          <DateBtn
            date={value.start}
            placeholder="Début"
            onSelect={(d) => {
              if (!d || value.mode !== 'custom') return;
              const start = new Date(d);
              start.setHours(0, 0, 0, 0);
              onChange({ ...value, start });
            }}
          />
          <span className="text-xs text-muted-foreground">→</span>
          <DateBtn
            date={value.end}
            placeholder="Fin"
            onSelect={(d) => {
              if (!d || value.mode !== 'custom') return;
              const end = new Date(d);
              end.setHours(23, 59, 59, 999);
              onChange({ ...value, end });
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
