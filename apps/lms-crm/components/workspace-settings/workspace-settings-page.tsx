'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  WORKSPACE_ACCOUNT_SETTINGS,
  WORKSPACE_SECTION_SCROLL_MARGIN,
  type WorkspaceAccountKind,
} from '@/config/workspace-settings.config';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { WorkspaceSettingsShell } from './workspace-settings-shell';
import { AccountSecuritySection } from './sections/account-security-section';
import { AccountPresenceSection } from './sections/account-presence-section';
import { AccountAppearanceSection } from './sections/account-appearance-section';
import { AccountNotificationsSection } from './sections/account-notifications-section';
import { AccountProfileLinkSection } from './sections/account-profile-link-section';
import { Info } from 'lucide-react';

function SectionBlock({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={WORKSPACE_SECTION_SCROLL_MARGIN}>
      {children}
    </section>
  );
}

function renderSection(
  sectionId: string,
  kind: WorkspaceAccountKind,
  profilPath: string,
  profilLinkLabel: string,
) {
  switch (sectionId) {
    case 'security':
      return <AccountSecuritySection />;
    case 'presence':
      return <AccountPresenceSection />;
    case 'notifications':
      return <AccountNotificationsSection />;
    case 'appearance':
      return <AccountAppearanceSection />;
    case 'profile-link':
      return (
        <AccountProfileLinkSection
          kind={kind}
          profilPath={profilPath}
          profilLinkLabel={profilLinkLabel}
        />
      );
    default:
      return null;
  }
}

export function WorkspaceSettingsPage({ kind }: { kind: WorkspaceAccountKind }) {
  const config = WORKSPACE_ACCOUNT_SETTINGS[kind];

  return (
    <PortalPageShell width="full">
      <PortalPageHero
        title={config.title}
        description={config.description}
        badge={config.badge}
      />

      {kind === 'crm-user' ? (
        <Alert variant="secondary" appearance="outline" className="mt-4 border-border">
          <AlertIcon>
            <Info className="size-4" />
          </AlertIcon>
          <AlertTitle className="text-sm font-semibold">Paramètres système établissement</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Cette page concerne votre <strong>compte utilisateur</strong>. La configuration
            établissement (NDA, notifications globales, intégrations…) reste dans{' '}
            <Link
              href="/securite-configuration/parametres/settings"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Paramètres système
            </Link>{' '}
            (réservé aux rôles autorisés).
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6">
        <WorkspaceSettingsShell config={config}>
          {config.sections.map((section) => (
            <Fragment key={section.anchor}>
              <SectionBlock id={section.anchor}>
                {renderSection(
                  section.id,
                  kind,
                  config.profilPath,
                  config.profilLinkLabel,
                )}
              </SectionBlock>
            </Fragment>
          ))}
        </WorkspaceSettingsShell>
      </div>
    </PortalPageShell>
  );
}
