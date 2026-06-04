'use client';

import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/communication-contenu"
      descriptionKey="sections.communicationContenu.welcomeDescription"
    />
  );
}
