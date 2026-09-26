'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { ContentLoader } from '@/components/common/content-loader';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import type { SystemSetting } from '@/app/models/system';
import type { UserRole } from '@/app/models/user';
import { SettingsProvider } from './components/settings-context';
import { CompanyProfileProvider } from './components/company-profile-context';
import { SettingsSidebarLayout } from './components/settings-sidebar-layout';

type SettingsPayload = {
  settings: SystemSetting | null;
  roles: UserRole[];
};

async function fetchSettings(): Promise<SettingsPayload> {
  const response = await apiFetch(
    '/api/sections/securite-configuration/parametres/settings',
  );
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json() as Promise<SettingsPayload>;
}

/** Restaure SettingsProvider + CompanyProfileProvider (requis par les sections). */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSettings,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  if (isLoading) {
    return (
      <CrmWiredLeaf path="/securite-configuration/parametres/settings">
        <ContentLoader className="mt-[20%]" />
      </CrmWiredLeaf>
    );
  }

  if (isError || !data?.settings) {
    return (
      <CrmWiredLeaf path="/securite-configuration/parametres/settings">
        <p className="text-sm text-muted-foreground">
          Impossible de charger les paramètres système.
        </p>
      </CrmWiredLeaf>
    );
  }

  return (
    <SettingsProvider settings={data.settings} roles={data.roles ?? []}>
      <CompanyProfileProvider>
        <CrmWiredLeaf path="/securite-configuration/parametres/settings">
          <SettingsSidebarLayout>{children}</SettingsSidebarLayout>
        </CrmWiredLeaf>
      </CompanyProfileProvider>
    </SettingsProvider>
  );
}
