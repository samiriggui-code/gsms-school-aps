'use client';

import { Fragment, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PORTAL_MENU_SIDEBAR } from '@/config/portal-menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';

const PORTAL_LABELS: Record<string, string> = {
  'mon-dossier': 'Mon dossier',
  notifications: 'Centre de notifications',
  parrainage: 'Parrainer un ami',
  cnaps: 'CNAPS',
  formation: 'Ma formation',
  'e-formation': 'E-formation',
  apprendre: 'E-formation',
  lecons: 'Module',
  modules: 'Module',
};

/** Fil d'Ariane Metronic — même rendu que `demo1/components/breadcrumb.tsx`. */
export function PortalBreadcrumb() {
  const pathname = usePathname();
  const { getBreadcrumb, isActive } = useMenu(pathname);

  const items = useMemo(() => {
    const fromMenu = getBreadcrumb(PORTAL_MENU_SIDEBAR);
    if (fromMenu.length > 0) return fromMenu;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    return segments.map((seg, i) => {
      const path = `/${segments.slice(0, i + 1).join('/')}`;
      const isId = seg.length > 20 || /^[a-f0-9-]{36}$/i.test(seg);
      let title = PORTAL_LABELS[seg] ?? seg;
      if (isId && (segments[i - 1] === 'lecons' || segments[i - 1] === 'modules')) title = 'Module';
      if (isId && (segments[0] === 'apprendre' || segments[0] === 'e-formation') && i === 1) {
        title = 'Parcours';
      }
      return { title, path };
    });
  }, [getBreadcrumb, pathname]);

  if (items.length === 0) return null;

  return (
    <div className="mb-2.5 flex items-center gap-1.25 text-xs font-medium lg:mb-0 lg:text-sm">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;

        return (
          <Fragment key={`${item.path ?? index}`}>
            {item.path && !last ? (
              <Link
                href={item.path}
                className={cn(
                  'hover:text-mono transition-colors',
                  active ? 'text-mono' : 'text-secondary-foreground',
                )}
              >
                {item.title}
              </Link>
            ) : (
              <span className={cn(last ? 'text-mono' : 'text-secondary-foreground')}>
                {item.title}
              </span>
            )}
            {!last ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
