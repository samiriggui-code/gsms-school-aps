'use client';

import Link from 'next/link';
import { Bell, BookOpen, FileText, Loader2 } from 'lucide-react';
import type { PortalActivityItem } from '@/lib/portal/portal-activity-feed';
import { formatPortalDate } from '@/lib/portal/format-portal-date';
import { cn } from '@/lib/utils';

const kindMeta: Record<
  PortalActivityItem['kind'],
  { icon: typeof FileText; className: string }
> = {
  admin: { icon: FileText, className: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  learning: { icon: BookOpen, className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  announcement: { icon: Bell, className: 'bg-purple-50 text-purple-600 border-purple-100' },
};

type Props = {
  items: PortalActivityItem[];
  loading?: boolean;
};

export function RecentActivityFeed({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Chargement de l&apos;activité…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune activité récente — votre parcours apparaîtra ici.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const meta = kindMeta[item.kind];
        const Icon = meta.icon;
        const inner = (
          <>
            <span
              className={cn(
                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border',
                meta.className,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 border-b border-transparent pb-4 last:pb-0">
              <p className="text-[13px]">
                <span className="font-medium text-foreground">{item.action}</span>
                <span className="ml-1 text-primary">{item.target}</span>
              </p>
              {item.detail ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatPortalDate(item.at)}
              </p>
            </div>
          </>
        );

        return (
          <li key={item.id} className="flex gap-3 py-3 first:pt-0">
            {item.href ? (
              <Link href={item.href} className="flex flex-1 gap-3 transition-opacity hover:opacity-80">
                {inner}
              </Link>
            ) : (
              <div className="flex flex-1 gap-3">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
