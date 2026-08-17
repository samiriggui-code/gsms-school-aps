'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import { ContentLoader } from '@/components/common/content-loader';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { UserManagementSupportSection } from '@/app/(protected)/securite-configuration/components/user-management-support-section';
import { SettingsProvider } from './components/settings-context';
import { CompanyProfileProvider } from './components/company-profile-context';
import { SettingsSidebarLayout } from './components/settings-sidebar-layout';
import { useTranslation } from '@/hooks/useTranslation';

const fetchSettings = async () => {
  const response = await apiFetch(
    '/api/sections/securite-configuration/parametres/settings',
  );
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { data = { settings: null, roles: [] }, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSettings,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { settings, roles } = data;

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  return (
    <SettingsProvider settings={settings} roles={roles}>
      <CompanyProfileProvider>
        <div className="flex flex-col">
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <ToolbarTitle>{t('pages.settings.title')}</ToolbarTitle>
                <ToolbarDescription>
                  {t('pages.settings.description')}
                </ToolbarDescription>
              </ToolbarHeading>
              <ToolbarActions />
            </Toolbar>
          </Container>

          <Container className="pb-8 lg:pb-10">
            <SettingsSidebarLayout>{children}</SettingsSidebarLayout>
          </Container>

          <UserManagementSupportSection className="relative z-0" />
        </div>
      </CompanyProfileProvider>
    </SettingsProvider>
  );
}
