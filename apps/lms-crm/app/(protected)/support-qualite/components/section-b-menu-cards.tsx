'use client';

import { LifeBuoy, ShieldCheck } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'support-qualite-support',
    path: '/support-qualite/support',
    descriptionKey: 'sections.supportQualite.cards.support',
    icon: LifeBuoy,
    backgroundImage: 'bg-3',
    subSections: ['tickets', 'base-aide'],
    tone: 'cyan' as const,
  },
  {
    moduleKey: 'support-qualite-qualite',
    path: '/support-qualite/qualite',
    descriptionKey: 'sections.supportQualite.cards.qualite',
    icon: ShieldCheck,
    backgroundImage: 'bg-3',
    subSections: ['incidents'],
    tone: 'orange' as const,
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
