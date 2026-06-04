'use client';

import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/securite-configuration"
      descriptionKey="sections.securiteConfiguration.welcomeDescription"
    />
  );
}
