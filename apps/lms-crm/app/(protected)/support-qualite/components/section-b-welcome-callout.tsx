'use client';

import { LifeBuoy } from 'lucide-react';
import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';
import { SectionModuleButtons } from '@/components/common/section-module-buttons';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/support-qualite"
      descriptionKey="sections.supportQualite.welcomeDescription"
      footerExtra={<SectionModuleButtons modules={[{ path: '/support-qualite/support', icon: LifeBuoy }]} />}
    />
  );
}
