'use client';

import { Receipt, Landmark, PieChart } from 'lucide-react';
import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';
import { SectionModuleButtons } from '@/components/common/section-module-buttons';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/administration-facturation"
      descriptionKey="sections.administrationFacturation.welcomeDescription"
      footerExtra={
        <SectionModuleButtons
          modules={[
            { path: '/administration-facturation/finance', icon: Receipt },
            { path: '/administration-facturation/financeurs', icon: Landmark },
            { path: '/administration-facturation/budget', icon: PieChart },
          ]}
        />
      }
    />
  );
}
