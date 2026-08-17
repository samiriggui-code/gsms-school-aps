'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RhDetailFieldRowProps = {
  icon?: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
  valueClassName?: string;
};

/** Ligne label/valeur — empilée sur mobile, côte à côte à partir de `sm`. */
export function RhDetailFieldRow({
  icon: Icon,
  label,
  children,
  className,
  valueClassName,
}: RhDetailFieldRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 border-b border-dashed border-border/60 pb-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 text-muted-foreground">
        {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
        <span className="text-2sm font-medium">{label}</span>
      </div>
      <div className={cn('min-w-0 break-words sm:max-w-[58%] sm:text-right', valueClassName)}>
        {children}
      </div>
    </div>
  );
}
