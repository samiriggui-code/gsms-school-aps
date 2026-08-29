'use client';

import { LifeBuoy } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'support-qualite-support',
    path: '/support-qualite/support',
    descriptionKey: 'sections.supportQualite.cards.support',
    icon: LifeBuoy,
    backgroundImage: 'bg-3',
    subSections: ['tickets', 'incidents'],
    subSectionPaths: ['/support-qualite/support/tickets', '/support-qualite/support/incidents'],
    tone: 'cyan' as const,
  },
];

export const SectionBMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.supportQualite.menuCardsTitle"
    subtitleKey="sections.supportQualite.menuCardsSubtitle"
    subtitleValues={{
      modules: items.length,
      pages: items.reduce((total, item) => total + item.subSections.length, 0),
    }}
    items={items}
  />
);
