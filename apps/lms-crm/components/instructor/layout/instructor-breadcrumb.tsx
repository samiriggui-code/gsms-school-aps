'use client';

import { Fragment, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { INSTRUCTOR_MENU_SIDEBAR } from '@/config/instructor-menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';

const INSTRUCTOR_LABELS: Record<string, string> = {
  formateur: 'Espace formateur',
  formations: 'Mes formations',
  sessions: 'Mes sessions',
  parcours: 'Mes parcours',
  stagiaires: 'Mes stagiaires',
  annonces: 'Annonces',
  notifications: 'Centre de notifications',
  profil: 'Mon profil',
  parametres: 'Paramètres du compte',
};

export function InstructorBreadcrumb() {
  const pathname = usePathname();
  const { getBreadcrumb, isActive } = useMenu(pathname);

  const items = useMemo(() => {
    const fromMenu = getBreadcrumb(INSTRUCTOR_MENU_SIDEBAR);
    if (fromMenu.length > 0) return fromMenu;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    return segments.map((seg, i) => {
      const path = `/${segments.slice(0, i + 1).join('/')}`;
      const title = INSTRUCTOR_LABELS[seg] ?? seg;
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
              <span className={cn(last ? 'text-mono' : 'text-secondary-foreground')}>{item.title}</span>
            )}
            {!last ? <ChevronRight className="size-3.5 text-muted-foreground" /> : null}
          </Fragment>
        );
      })}
    </div>
  );
}
