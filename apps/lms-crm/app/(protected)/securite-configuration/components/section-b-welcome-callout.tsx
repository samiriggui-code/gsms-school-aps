'use client';

import { Lock, Settings, Database } from 'lucide-react';
import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';
import { SectionModuleButtons } from '@/components/common/section-module-buttons';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/securite-configuration"
      descriptionKey="sections.securiteConfiguration.welcomeDescription"
      footerExtra={
        <SectionModuleButtons
          modules={[
            { path: '/securite-configuration/acces', icon: Lock },
            { path: '/securite-configuration/parametres', icon: Settings },
            { path: '/securite-configuration/gouvernance-donnees', icon: Database },
          ]}
        />
      }
    />
  );
}
