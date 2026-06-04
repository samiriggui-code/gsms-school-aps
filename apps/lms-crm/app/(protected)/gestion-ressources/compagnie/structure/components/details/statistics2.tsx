'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type DocItem = {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'muted';
};

export function Statistics2({ items }: { items: DocItem[] }) {
  return (
    <Card className="rounded-xl border border-border/60 bg-background shadow-none">
      <CardContent className="p-0">
        <div className="grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {items.map((item, index) => (
            <div key={index} className="px-5 py-4 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </div>
              <div
                className={cn(
                  'text-sm font-semibold',
                  item.tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
                  item.tone === 'warning' && 'text-amber-600 dark:text-amber-400',
                  item.tone === 'muted' && 'text-muted-foreground'
                )}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
