'use client';

import { Fragment, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuItem } from '@/config/types';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import { translateMenuTitle } from '@/lib/menu-i18n';
import { useTranslation } from '@/hooks/useTranslation';

export function Breadcrumb() {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items: MenuItem[] = getBreadcrumb(MENU_SIDEBAR);

  const normalizedItems = useMemo(() => {
    const home: MenuItem = { title: 'Accueil', path: '/accueil' };
    if (items.length === 0) return [home];

    const first = items[0];
    const startsWithHome = first.path === '/accueil' || first.title === 'Accueil';
    const merged = startsWithHome ? items : [home, ...items];

    // Dédoublonne par path seul (pas path+title) : évite une double miette quand
    // section et module partagent la même URL (ex. Qualiopi = section et module).
    const seen = new Set<string>();
    return merged.filter((item) => {
      const key = item.path || item.title || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items]);

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <div
      key={i18n.language}
      className="flex items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0"
    >
      {normalizedItems.map((item, index) => {
        const last = index === normalizedItems.length - 1;
        const active = item.path ? isActive(item.path) : false;
        const label = translateMenuTitle(item, t);

        return (
          <Fragment key={`root-${item.path ?? index}`}>
            {item.path && !last ? (
              <Link
                href={item.path}
                className={cn(
                  'hover:text-mono transition-colors',
                  active ? 'text-mono' : 'text-secondary-foreground',
                )}
              >
                {label}
              </Link>
            ) : (
              <span className={cn(active || last ? 'text-mono' : 'text-secondary-foreground')}>
                {label}
              </span>
            )}
            {!last && <ChevronRight className="size-3.5 text-muted-foreground" />}
          </Fragment>
        );
      })}
    </div>
  );
}
