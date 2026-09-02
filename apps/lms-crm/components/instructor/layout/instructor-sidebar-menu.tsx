'use client';

import { JSX, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { INSTRUCTOR_MENU_SIDEBAR } from '@/config/instructor-menu.config';
import type { MenuConfig } from '@/config/types';
import { filterMenuConfig } from '@/lib/menu-access';
import { apiFetch } from '@/lib/api';
import { INSTRUCTOR_SUMMARY_API } from '@/lib/instructor/instructor-paths';
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
} from '@repo/ui/accordion-menu';
import { Badge } from '@repo/ui/badge';
import { useNavigationLoading } from '@/providers/navigation-loading-provider';

export function InstructorSidebarMenu() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { startNavigation } = useNavigationLoading();

  const menuItems = filterMenuConfig(INSTRUCTOR_MENU_SIDEBAR, {
    roleSlug: session?.user?.roleSlug,
    permissionSlugs: session?.user?.permissionSlugs
      ? new Set(session.user.permissionSlugs)
      : undefined,
  });

  const { data: summary } = useQuery({
    queryKey: ['instructor-summary'],
    queryFn: async () => {
      const res = await apiFetch(INSTRUCTOR_SUMMARY_API);
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          stats: { upcomingSessionCount: number };
          nextSession: { label: string; formationName: string } | null;
        };
      };
      if (!res.ok || !json.success) return null;
      return json.data ?? null;
    },
    staleTime: 30_000,
  });

  const matchPath = useCallback(
    (path: string): boolean => {
      if (pathname === path) return true;
      if (path === '/formateur') return pathname === '/formateur';
      return path.length > 1 && pathname.startsWith(path);
    },
    [pathname],
  );

  const classNames: AccordionMenuClassNames = {
    root: 'lg:ps-1 space-y-3',
    group: 'gap-0.5',
    label: 'uppercase text-[10px] font-medium tracking-wide text-muted-foreground/70 pt-2 pb-px',
    separator: '',
    item: 'h-9 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    sub: '',
    subTrigger:
      'h-9 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    subContent: 'py-0',
    indicator: '',
  };

  const buildMenu = (items: MenuConfig): JSX.Element[] =>
    items.map((item, index) => {
      if (item.heading) {
        return <AccordionMenuLabel key={`heading-${index}`}>{item.heading}</AccordionMenuLabel>;
      }
      return (
        <AccordionMenuItem
          key={item.path ?? index}
          value={item.path || ''}
          className="text-[13px] font-normal"
        >
          <Link
            href={item.path || '#'}
            onClick={() => startNavigation()}
            className="flex w-full min-w-0 items-center gap-2.5"
          >
            {item.icon ? <item.icon data-slot="accordion-menu-icon" className="size-4 shrink-0" /> : null}
            <span data-slot="accordion-menu-title" className="truncate">
              {item.title}
            </span>
          </Link>
        </AccordionMenuItem>
      );
    });

  return (
    <div className="flex h-full flex-col">
      <div className="kt-scrollable-y-hover flex grow shrink-0 flex-col py-5 px-5 lg:max-h-[calc(100vh-5.5rem)]">
        <AccordionMenu
          selectedValue={pathname}
          matchPath={matchPath}
          type="single"
          collapsible
          classNames={classNames}
        >
          <AccordionMenuGroup>{buildMenu(menuItems)}</AccordionMenuGroup>

          {summary?.nextSession ? (
            <AccordionMenuGroup>
              <AccordionMenuItem value="__next_session__" className="text-[13px] font-normal">
                <Link
                  href="/formateur/sessions"
                  onClick={() => startNavigation()}
                  className="flex w-full min-w-0 items-center gap-2.5"
                  title={`${summary.nextSession.formationName} · ${summary.nextSession.label}`}
                >
                  <CalendarDays data-slot="accordion-menu-icon" className="size-4 shrink-0" />
                  <span data-slot="accordion-menu-title" className="truncate">
                    Prochaine session
                  </span>
                  <Badge
                    data-slot="badge"
                    variant="default"
                    appearance="light"
                    size="sm"
                    className="ms-auto shrink-0 text-[10px]"
                  >
                    {summary.stats.upcomingSessionCount}
                  </Badge>
                </Link>
              </AccordionMenuItem>
            </AccordionMenuGroup>
          ) : null}
        </AccordionMenu>
      </div>
    </div>
  );
}
