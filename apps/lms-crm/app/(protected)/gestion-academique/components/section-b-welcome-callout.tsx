'use client';

import { GraduationCap, Laptop, ClipboardList } from 'lucide-react';
import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';
import { SectionModuleButtons } from '@/components/common/section-module-buttons';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/gestion-academique"
      descriptionKey="sections.gestionAcademique.welcomeDescription"
      footerExtra={
        <SectionModuleButtons
          modules={[
            { path: '/gestion-academique/vie-scolaire', icon: GraduationCap },
            { path: '/gestion-academique/lms', icon: Laptop },
            { path: '/gestion-academique/suivi-formations', icon: ClipboardList },
          ]}
        />
      }
    />
  );
}
