'use client';

import { ClipboardCheck, TrendingUp, Sparkles } from 'lucide-react';
import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';
import { SectionModuleButtons } from '@/components/common/section-module-buttons';

export function QualiopiSectionWelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/qualiopi"
      descriptionKey="sections.qualiopi.welcomeDescription"
      footerExtra={
        <SectionModuleButtons
          modules={[
            { path: '/qualiopi/referentiel', icon: ClipboardCheck },
            { path: '/qualiopi/pilotage', icon: TrendingUp },
            { path: '/qualiopi/ia', icon: Sparkles },
          ]}
        />
      }
    />
  );
}
