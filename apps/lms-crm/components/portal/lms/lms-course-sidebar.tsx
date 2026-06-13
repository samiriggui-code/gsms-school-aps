'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { E_FORMATION_BASE, eFormationModulePath } from '@/lib/portal/e-formation-paths';
import { cn } from '@/lib/utils';
import type { LmsSyllabusItem } from '@/lib/portal/lms-types';

type Props = {
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  tier: string;
  items: LmsSyllabusItem[];
};

export function LmsCourseSidebar({ courseId, courseTitle, progressPercent, tier, items }: Props) {
  return (
    <aside className="flex h-full max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/20 p-4">
        <Link
          href={E_FORMATION_BASE}
          className="text-xs font-medium text-primary hover:underline"
        >
          ← Mes formations
        </Link>
        <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{courseTitle}</h2>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Progression</span>
            <span className="font-medium text-foreground">{progressPercent} %</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {tier === 'pre_cnaps' ? (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] leading-snug text-amber-900 dark:text-amber-200">
            Modules préparatoires actifs — le reste s&apos;ouvre après validation CNAPS.
          </p>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ol className="space-y-0.5">
          {items.map((item, index) => {
            const href = eFormationModulePath(courseId, item.id);
            const locked = !item.accessible;

            if (locked) {
              return (
                <li
                  key={item.id}
                  title={item.lockReason ?? undefined}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground"
                >
                  <Lock className="size-4 shrink-0 opacity-50" />
                  <span className="line-clamp-2 flex-1">{item.title}</span>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all',
                    item.current
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted/80',
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2
                      className={cn('size-4 shrink-0', item.current ? '' : 'text-primary')}
                    />
                  ) : item.current ? (
                    <PlayCircle className="size-4 shrink-0" />
                  ) : (
                    <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                  <span className="line-clamp-2 flex-1 font-medium">{item.title}</span>
                  {item.isFree ? (
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wide',
                        item.current ? 'text-primary-foreground/80' : 'text-primary',
                      )}
                    >
                      Prépa
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
