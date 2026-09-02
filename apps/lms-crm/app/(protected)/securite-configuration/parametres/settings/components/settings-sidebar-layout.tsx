'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings as useThemeSettings } from '@/providers/settings-provider';
import { Scrollspy } from '@repo/ui/scrollspy';
import { SettingsSidebarNav } from './settings-sidebar-nav';

const stickySidebarClasses: Record<string, string> = {
  'demo1-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo2-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo3-layout': 'top-[calc(var(--header-height)+var(--navbar-height)+1rem)]',
  'demo4-layout': 'top-[3rem]',
  'demo5-layout': 'top-[calc(var(--header-height)+1.5rem)]',
  'demo6-layout': 'top-[3rem]',
  'demo7-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo8-layout': 'top-[3rem]',
  'demo9-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo10-layout': 'top-[1.5rem]',
};

export function SettingsSidebarLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { settings } = useThemeSettings();
  const parentRef = useRef<HTMLElement | Document>(document);

  const stickyClass = settings?.layout
    ? stickySidebarClasses[settings.layout] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  return (
    <div className="flex min-w-0 grow items-start gap-5 lg:gap-7.5">
      {!isMobile && (
        <aside className="w-[230px] shrink-0 self-start">
          <div className={cn('sticky z-[1] w-[230px]', stickyClass)}>
            <Scrollspy offset={120} targetRef={parentRef}>
              <SettingsSidebarNav />
            </Scrollspy>
          </div>
        </aside>
      )}
      <div className="flex min-w-0 grow flex-col items-stretch gap-5 lg:gap-7.5">
        {children}
      </div>
    </div>
  );
}
