'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface TimelineItemProps {
  icon: LucideIcon;
  line: boolean;
  children: ReactNode;
  removeSpace?: boolean;
  className?: string;
}

export function TimelineItem({
  line,
  icon: Icon,
  children,
  removeSpace,
  className,
}: TimelineItemProps) {
  return (
    <div className="flex w-full min-w-0 items-stretch gap-2.5 sm:gap-3">
      <div className="flex w-10 shrink-0 flex-col items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <div className="flex size-[34px] items-center justify-center rounded-md bg-accent/70">
            <Icon size={18} className={className || ''} />
          </div>
        </div>
        {line ? (
          <div className="mt-1.5 w-px min-h-4 flex-1 bg-border" aria-hidden />
        ) : null}
      </div>
      <div className={`min-w-0 flex-1 pt-0.5 ${!removeSpace ? 'pb-5' : ''}`}>
        {children}
      </div>
    </div>
  );
}
