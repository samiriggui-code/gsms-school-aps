'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { portalLabel, portalSectionTitle, portalMuted } from './portal-ui';

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'muted' | 'outline';
};

const variantClass = {
  default: 'bg-card border shadow-xs',
  muted: 'bg-muted/25 border border-border/60',
  outline: 'bg-transparent border border-dashed border-border',
};

export function PortalSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
  variant = 'default',
}: Props) {
  return (
    <section
      className={cn('overflow-hidden rounded-xl', variantClass[variant], className)}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon ? (
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-3.5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className={portalSectionTitle}>{title}</h2>
            {description ? <p className={cn('mt-0.5', portalMuted)}>{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn('p-4 sm:p-5', contentClassName)}>{children}</div>
    </section>
  );
}

export function PortalFieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass =
    cols === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : cols === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2';
  return <dl className={cn('grid gap-x-6 gap-y-4', colClass)}>{children}</dl>;
}

export function PortalField({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className={portalLabel}>{label}</dt>
      <dd className="mt-1 flex items-start gap-2 text-[13px] font-medium text-foreground">
        {Icon ? <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> : null}
        <span className="min-w-0 break-words">{value}</span>
      </dd>
    </div>
  );
}
