'use client';

import { GeneralSettingsForm } from './general-settings-form';
import { EtablissementSettingsSection } from './sections/etablissement-settings-section';
import { LegalSettingsSection } from './sections/legal-settings-section';
import { FormationSettingsSection } from './sections/formation-settings-section';
import { DirigeantSettingsSection } from './sections/dirigeant-settings-section';
import { RegistreSettingsSection } from './sections/registre-settings-section';
import { NotificationsSettingsSection } from './sections/notifications-settings-section';
import { SocialSettingsSection } from './sections/social-settings-section';
import { IntegrationsSettingsSection } from './sections/integrations-settings-section';
import {
  SETTINGS_ANCHOR_IDS,
  SETTINGS_SECTION_SCROLL_MARGIN,
} from '../lib/settings-anchors';

export function SettingsContent() {
  return (
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
      <section
        id={SETTINGS_ANCHOR_IDS.general}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <GeneralSettingsForm />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.etablissement}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <EtablissementSettingsSection />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.legal}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <LegalSettingsSection />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.formation}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <FormationSettingsSection />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.dirigeant}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <DirigeantSettingsSection />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.registre}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <RegistreSettingsSection />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.notifications}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <NotificationsSettingsSection />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.social}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <SocialSettingsSection />
      </section>
      <section
        id={SETTINGS_ANCHOR_IDS.integrations}
        className={SETTINGS_SECTION_SCROLL_MARGIN}
      >
        <IntegrationsSettingsSection />
      </section>
    </div>
  );
}
