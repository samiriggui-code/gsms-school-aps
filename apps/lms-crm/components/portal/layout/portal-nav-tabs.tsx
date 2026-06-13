'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { portalText } from './portal-ui';

export type PortalNavTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
  badge?: string | number;
  count?: number;
};

export function PortalNavTabs({ tabs }: { tabs: PortalNavTab[] }) {
  return (
    <nav className="flex gap-0.5 overflow-x-auto rounded-lg border bg-muted/30 p-0.5">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 transition-colors',
            portalText,
            tab.active
              ? 'bg-background font-medium text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
          )}
        >
          <tab.icon className="size-3.5" />
          {tab.label}
          {tab.badge != null && tab.badge !== '' ? (
            <span className="rounded-full bg-primary/12 px-1.5 py-px text-[10px] font-semibold text-primary">
              {tab.badge}
            </span>
          ) : null}
          {tab.count != null && tab.count > 0 ? (
            <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {tab.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
