'use client';



import { JSX, useCallback } from 'react';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { TrendingUp } from 'lucide-react';

import { useSession } from 'next-auth/react';
import { PORTAL_MENU_SIDEBAR } from '@/config/portal-menu.config';
import { filterMenuConfig } from '@/lib/menu-access';

import type { MenuConfig } from '@/config/types';

import { apiFetch } from '@/lib/api';

import {

  AccordionMenu,

  AccordionMenuClassNames,

  AccordionMenuGroup,

  AccordionMenuItem,

  AccordionMenuLabel,

} from '@/components/ui/accordion-menu';

import { Badge } from '@/components/ui/badge';

import { useNavigationLoading } from '@/providers/navigation-loading-provider';



export function PortalSidebarMenu() {

  const pathname = usePathname();

  const { data: session } = useSession();

  const { startNavigation } = useNavigationLoading();

  const menuItems = filterMenuConfig(PORTAL_MENU_SIDEBAR, {
    roleSlug: session?.user?.roleSlug,
    permissionSlugs: session?.user?.permissionSlugs
      ? new Set(session.user.permissionSlugs)
      : undefined,
  });



  const { data: summary } = useQuery({

    queryKey: ['portal-summary'],

    queryFn: async () => {

      const res = await apiFetch('/api/portal/summary');

      const json = (await res.json()) as {

        success?: boolean;

        data?: {

          tierLabel: string;

          formation: { name: string } | null;

          stats: { progressPercent: number; completedChapterCount: number; chapterCount: number };

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

      if (path === '/e-formation/quiz') {

        return pathname.startsWith('/e-formation/quiz');

      }

      if (path === '/e-formation') {

        return (

          pathname.startsWith('/e-formation/') && !pathname.startsWith('/e-formation/quiz')

        );

      }

      return path.length > 1 && pathname.startsWith(path);

    },

    [pathname],

  );



  const classNames: AccordionMenuClassNames = {

    root: 'lg:ps-1 space-y-3',

    group: 'gap-0.5',

    label:

      'uppercase text-[10px] font-medium tracking-wide text-muted-foreground/70 pt-2 pb-px',

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

        return (

          <AccordionMenuLabel key={`heading-${index}`}>{item.heading}</AccordionMenuLabel>

        );

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



          {summary?.formation ? (

            <AccordionMenuGroup>

              <AccordionMenuItem

                value="__formation_lms__"

                className="text-[13px] font-normal"

              >

                <Link

                  href="/e-formation"

                  onClick={() => startNavigation()}

                  className="flex w-full min-w-0 items-center gap-2.5"

                  title={`${summary.formation.name} · ${summary.tierLabel}`}

                >

                  <TrendingUp data-slot="accordion-menu-icon" className="size-4 shrink-0" />

                  <span data-slot="accordion-menu-title" className="truncate">

                    {summary.formation.name}

                  </span>

                  <Badge

                    data-slot="badge"

                    variant="primary"

                    appearance="light"

                    size="sm"

                    className="ms-auto shrink-0 text-[10px]"

                  >

                    {summary.stats.progressPercent} %

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

