'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { PortalSidebarHeader } from './portal-sidebar-header';
import { PortalSidebarMenu } from './portal-sidebar-menu';

/** Même structure/classes que `demo1/components/sidebar.tsx`. */
export function PortalSidebar() {
  const { settings } = useSettings();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'sidebar bg-background lg:border-e lg:border-border lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0',
        (settings.layouts.demo1.sidebarTheme === 'dark' || pathname.includes('dark-sidebar')) &&
          'dark',
      )}
    >
      <PortalSidebarHeader />
      <div className="overflow-hidden">
        <div className="w-(--sidebar-default-width)">
          <PortalSidebarMenu />
        </div>
      </div>
    </div>
  );
}
