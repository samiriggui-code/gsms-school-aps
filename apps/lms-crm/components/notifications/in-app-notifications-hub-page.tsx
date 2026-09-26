'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { AccountNotificationsDatagrid } from '@/app/(protected)/mon-profil/notifications/components/account-notifications-datagrid';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { Button } from '@repo/ui/button';
import type { WorkspaceAccountKind } from '@/config/workspace-settings.config';
import { WORKSPACE_ACCOUNT_SETTINGS } from '@/config/workspace-settings.config';

type Props = {
  kind: WorkspaceAccountKind;
  title?: string;
  description?: string;
  badge?: string;
};

export function InAppNotificationsHubPage({
  kind,
  title = 'Notifications & alertes',
  description = 'Historique in-app, filtres et actions groupées.',
  badge,
}: Props) {
  const settingsPath = WORKSPACE_ACCOUNT_SETTINGS[kind].settingsPath;
  const resolvedBadge = badge ?? WORKSPACE_ACCOUNT_SETTINGS[kind].badge;

  return (
    <PortalPageShell width="full">
      <PortalPageHero
        title={title}
        description={description}
        badge={resolvedBadge}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`${settingsPath}#ws_notifications`}>
              <Settings className="mr-2 size-4" />
              Préférences de réception
            </Link>
          </Button>
        }
      />
      <div className="mt-6">
        <AccountNotificationsDatagrid scope={kind} />
      </div>
    </PortalPageShell>
  );
}
