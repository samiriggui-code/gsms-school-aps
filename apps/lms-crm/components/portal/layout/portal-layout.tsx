'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import { PortalAnnouncementBanner } from './portal-announcement-banner';
import { PortalHeader } from './portal-header';
import { PortalSidebar } from './portal-sidebar';
import { UserManagementSupportSection } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

/** Calqué sur `demo1/layout.tsx` — mêmes classes body + structure wrapper. */
export function PortalLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { settings, setOption, storeOption } = useSettings();
  const prevSidebarCollapse = useRef<boolean | null>(null);

  const isEFormationRoute = pathname.startsWith('/e-formation');

  useEffect(() => {
    if (isEFormationRoute) {
      if (prevSidebarCollapse.current === null) {
        prevSidebarCollapse.current = settings.layouts.demo1.sidebarCollapse;
        if (!settings.layouts.demo1.sidebarCollapse) {
          storeOption('layouts.demo1.sidebarCollapse', true);
        }
      }
      return;
    }

    if (prevSidebarCollapse.current !== null) {
      storeOption('layouts.demo1.sidebarCollapse', prevSidebarCollapse.current);
      prevSidebarCollapse.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore only on route change
  }, [isEFormationRoute, storeOption]);

  useEffect(() => {
    const bodyClass = document.body.classList;
    if (settings.layouts.demo1.sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
  }, [settings]);

  useEffect(() => {
    setOption('layout', 'demo1');
  }, [setOption]);

  useEffect(() => {
    const bodyClass = document.body.classList;
    bodyClass.add('demo1', 'sidebar-fixed', 'header-fixed');

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 1000);

    return () => {
      bodyClass.remove('demo1', 'sidebar-fixed', 'sidebar-collapse', 'header-fixed', 'layout-initialized');
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {!isMobile && <PortalSidebar />}

      <div className="wrapper flex min-h-0 min-w-0 w-full grow flex-col">
        <PortalHeader />
        <PortalAnnouncementBanner />

        <main className="flex min-w-0 w-full grow flex-col pt-5" role="content">
          <div className="page-main-content min-h-0 min-w-0 w-full flex-1 pb-6 lg:pb-10">
            {children}
          </div>
          <UserManagementSupportSection audience="portal" />
        </main>
      </div>
    </>
  );
}
