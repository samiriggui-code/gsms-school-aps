'use client';

import { GeneralSettingsForm } from './general-settings-form';
import { AdministrativeDossierSettingsSection } from './sections/administrative-dossier-settings-section';
import { EtablissementSettingsSection } from './sections/etablissement-settings-section';
import { LegalSettingsSection } from './sections/legal-settings-section';
import { FormationSettingsSection } from './sections/formation-settings-section';
import { DirigeantSettingsSection } from './sections/dirigeant-settings-section';
import { RegistreSettingsSection } from './sections/registre-settings-section';
import { NotificationsSettingsSection } from './sections/notifications-settings-section';
import { SocialSettingsSection } from './sections/social-settings-section';
import { IntegrationsSettingsSection } from './sections/integrations-settings-section';
import { SettingsCollapsibleSection } from './settings-collapsible-section';
import { SettingsSectionsProvider } from './settings-sections-context';
import { DashboardLayoutSettings } from '../../components/dashboard-layout-settings';
import { ModuleParametersSettings } from '../../components/module-parameters-settings';
import { WorkspacePagesSettings } from '../../components/workspace-pages-settings';
import { SETTINGS_ANCHOR_IDS } from '../lib/settings-anchors';

const SECTIONS = [
  {
    id: SETTINGS_ANCHOR_IDS.general,
    title: 'Général',
    description: 'Logo, nom, langue, devise, fuseau et statut plateforme.',
    content: <GeneralSettingsForm />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.administrativeDossier,
    title: 'Dossier administratif',
    description: 'Pièces réglementaires et métadonnées dossier école (JSON).',
    content: <AdministrativeDossierSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.etablissement,
    title: 'Établissement',
    description: 'Identité, adresse, site web et contacts.',
    content: <EtablissementSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.legal,
    title: 'Identité légale',
    description: 'SIRET, SIREN, CNAPS, TVA, NAF, RCS.',
    content: <LegalSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.formation,
    title: 'Formation & conformité',
    description: 'NDA, Qualiopi, agréments ADEF / SSIAP.',
    content: <FormationSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.dirigeant,
    title: 'Dirigeant',
    description: 'Responsable légal, photo et rôle affiché.',
    content: <DirigeantSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.registre,
    title: 'Registre INPI',
    description: 'INPI, dates RNE, capital social.',
    content: <RegistreSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.notifications,
    title: 'Notifications système',
    description: 'Alertes stock, commandes, paiements et erreurs.',
    content: <NotificationsSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.social,
    title: 'Réseaux sociaux',
    description: 'Facebook, LinkedIn, Instagram, YouTube…',
    content: <SocialSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.integrations,
    title: 'Intégrations',
    description: 'Redis, e-mail, Pusher, landing, Sentry.',
    content: <IntegrationsSettingsSection />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.dashboard,
    title: 'Layouts & blocs visibles',
    description: 'Dashboards CRM / formateur / stagiaire et landings modules.',
    content: <DashboardLayoutSettings />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.modules,
    title: 'Paramètres métier',
    description: 'SLA support, workflow devis, seuils pilotage.',
    content: <ModuleParametersSettings />,
  },
  {
    id: SETTINGS_ANCHOR_IDS.workspacePages,
    title: 'Réglages par page',
    description: 'Liens vers landing, SEO, finance, support et comptes.',
    content: <WorkspacePagesSettings />,
  },
] as const;

export function SettingsContent() {
  return (
    <SettingsSectionsProvider defaultOpen={[SETTINGS_ANCHOR_IDS.general]}>
      <div className="flex flex-col gap-3 lg:gap-4">
        {SECTIONS.map((section) => (
          <SettingsCollapsibleSection
            key={section.id}
            id={section.id}
            title={section.title}
            description={section.description}
          >
            {section.content}
          </SettingsCollapsibleSection>
        ))}
      </div>
    </SettingsSectionsProvider>
  );
}
