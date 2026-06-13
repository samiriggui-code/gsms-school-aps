'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { portalLabel, portalText } from './portal-ui';

export type PortalStatItem = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'default' | 'primary' | 'success' | 'warning';
  href?: string;
  progress?: number;
};

const toneClass: Record<NonNullable<PortalStatItem['tone']>, string> = {
  default: 'bg-muted/50 text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

function StatCard({ item }: { item: PortalStatItem }) {
  const inner = (
    <article
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-4 transition-all',
        item.href && 'hover:border-primary/25 hover:shadow-sm',
      )}
    >
      {item.progress != null ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-primary/20"
          aria-hidden
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
          />
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={portalLabel}>{item.label}</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{item.value}</p>
          {item.hint ? (
            <p className={cn('mt-0.5 line-clamp-2', portalText, 'text-muted-foreground')}>
              {item.hint}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
            toneClass[item.tone ?? 'default'],
          )}
        >
          <item.icon className="size-4" />
        </span>
      </div>
    </article>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function PortalStatGrid({
  items,
  columns = 4,
}: {
  items: PortalStatItem[];
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 xl:grid-cols-4';

  return (
    <div className={cn('grid gap-3', colClass)}>
      {items.map((item) => (
        <StatCard key={item.label} item={item} />
      ))}
    </div>
  );
}
