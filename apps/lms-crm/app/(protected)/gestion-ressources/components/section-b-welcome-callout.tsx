'use client';

import { Building2, Users, HeartHandshake, Wrench } from 'lucide-react';
import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';
import { SectionModuleButtons } from '@/components/common/section-module-buttons';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/gestion-ressources"
      descriptionKey="sections.gestionRessources.welcomeDescription"
      footerExtra={
        <SectionModuleButtons
          modules={[
            { path: '/gestion-ressources/compagnie', icon: Building2 },
            { path: '/gestion-ressources/rh', icon: Users },
            { path: '/gestion-ressources/partenaires', icon: HeartHandshake },
            { path: '/gestion-ressources/equipements', icon: Wrench },
          ]}
        />
      }
    />
  );
}
