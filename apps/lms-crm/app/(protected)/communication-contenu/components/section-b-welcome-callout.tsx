'use client';

import { FileText, Megaphone, Search } from 'lucide-react';
import { SectionWelcomeCallout } from '@/components/common/section-welcome-callout';
import { SectionModuleButtons } from '@/components/common/section-module-buttons';

export function WelcomeCallout({ className }: { className?: string }) {
  return (
    <SectionWelcomeCallout
      className={className}
      sectionPath="/communication-contenu"
      descriptionKey="sections.communicationContenu.welcomeDescription"
      footerExtra={
        <SectionModuleButtons
          modules={[
            { path: '/communication-contenu/cms', icon: FileText },
            { path: '/communication-contenu/marketing', icon: Megaphone },
            { path: '/communication-contenu/seo', icon: Search },
          ]}
        />
      }
    />
  );
}
