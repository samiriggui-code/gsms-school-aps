'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Scrollspy } from '@repo/ui/scrollspy';
import { WorkspaceSettingsNav } from './workspace-settings-nav';
import type { WorkspaceAccountSettingsDef } from '@/config/workspace-settings.config';

export function WorkspaceSettingsShell({
  config,
  children,
}: {
  config: WorkspaceAccountSettingsDef;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  return (
    <div className="flex grow gap-5 lg:gap-7.5">
      {!isMobile ? (
        <div className="w-[230px] shrink-0">
          <div
            className={cn(
              'w-[230px]',
              sidebarSticky && 'fixed z-10 start-auto top-[calc(var(--header-height)+1rem)]',
            )}
          >
            <Scrollspy offset={120} targetRef={parentRef}>
              <WorkspaceSettingsNav sections={config.sections} />
            </Scrollspy>
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 grow flex-col items-stretch gap-5 lg:gap-7.5">
        {children}
      </div>
    </div>
  );
}
