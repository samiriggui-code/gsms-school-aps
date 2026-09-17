'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  lead: string;
  detail: string;
  className?: string;
};

export function PilotagePageIntro({ lead, detail, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-muted/30 px-4 py-3.5 lg:px-5',
        className,
      )}
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">{lead}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
        </div>
      </div>
    </div>
  );
}
