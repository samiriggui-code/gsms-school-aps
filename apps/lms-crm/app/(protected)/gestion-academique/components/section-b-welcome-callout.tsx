'use client';

import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/gestion-academique"
      descriptionKey="sections.gestionAcademique.welcomeDescription"
    />
  );
}
