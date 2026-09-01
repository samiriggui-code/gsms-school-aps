'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/providers/settings-provider';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';
import { UserManagementSupportSection } from '@/app/(protected)/securite-configuration/components/user-management-support-section';
import { EveAssistant } from '@/components/eve/eve-assistant';

export function Demo1Layout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { settings, setOption } = useSettings();

  /** Aide injectée dans le layout Paramètres système (évite chevauchement sidebar). */
  const hideGlobalHelp = pathname?.includes('/parametres/settings') ?? false;

  useEffect(() => {
    const bodyClass = document.body.classList;

    if (settings.layouts.demo1.sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
  }, [settings]); // Runs only on settings update

  useEffect(() => {
    // Set current layout
    setOption('layout', 'demo1');
  }, [setOption]);

  useEffect(() => {
    const bodyClass = document.body.classList;

    // Add a class to the body element
    bodyClass.add('demo1');
    bodyClass.add('sidebar-fixed');
    bodyClass.add('header-fixed');

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 1000); // 1000 milliseconds

    // Remove the class when the component is unmounted
    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
      bodyClass.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []); // Runs only once on mount

  return (
    <>
      {!isMobile && <Sidebar />}

      <div className="wrapper flex min-h-0 min-w-0 w-full grow flex-col">
        <Header />

        <main className="flex min-w-0 w-full grow flex-col pt-4" role="content">
          <div className="page-main-content min-w-0 w-full min-h-0 flex-1 pb-5 lg:pb-8">
            {children}
          </div>
          {!hideGlobalHelp && <UserManagementSupportSection />}
        </main>

        <Footer />
      </div>
      <EveAssistant />
    </>
  );
}

export default Demo1Layout;
