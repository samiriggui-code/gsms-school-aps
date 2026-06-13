'use client';

import { ReactNode, Suspense } from 'react';
import type { Session } from 'next-auth';
import { AuthProvider } from '@/providers/auth-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { ModulesProvider } from '@/providers/modules-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SettingsProvider } from '@/providers/settings-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { TooltipsProvider } from '@/providers/tooltips-provider';
import { Toaster } from '@/components/ui/sonner';

type Props = {
  children: ReactNode;
  session: Session | null;
};

/** Boundary client unique pour le root layout (évite les erreurs Turbopack app-ssr / query-provider). */
export function AppProviders({ children, session }: Props) {
  return (
    <QueryProvider>
      <AuthProvider session={session}>
        <SettingsProvider>
          <ThemeProvider>
            <I18nProvider>
              <TooltipsProvider>
                <ModulesProvider>
                  <div className="min-h-screen w-full">
                    <Suspense>{children}</Suspense>
                  </div>
                  <Toaster />
                </ModulesProvider>
              </TooltipsProvider>
            </I18nProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
