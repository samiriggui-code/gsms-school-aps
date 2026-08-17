'use client';

import { ReactNode, useEffect } from 'react';
import { useSettings } from '@/providers/settings-provider';
import { InstructorHeader } from './instructor-header';
import { InstructorSidebar } from './instructor-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserManagementSupportSection } from '@/app/(protected)/securite-configuration/components/user-management-support-section';

export function InstructorLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { settings, setOption } = useSettings();

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
      {!isMobile && <InstructorSidebar />}

      <div className="wrapper flex min-h-0 min-w-0 w-full grow flex-col">
        <InstructorHeader />

        <main className="flex min-w-0 w-full grow flex-col pt-5" role="content">
          <div className="page-main-content min-h-0 min-w-0 w-full flex-1 pb-6 lg:pb-10">
            {children}
          </div>
          <UserManagementSupportSection audience="instructor" />
        </main>
      </div>
    </>
  );
}
