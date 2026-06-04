'use client';

import { Activity } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'pilotage-supervision-pilotage',
    path: '/pilotage-supervision/pilotage',
    descriptionKey: 'sections.pilotageSupervision.cards.pilotage',
    icon: Activity,
    backgroundImage: 'bg-3',
    subSections: ['alertes', 'indicateurs', 'rapports', 'risques'],
    tone: 'cyan' as const,
  },
];

export const SectionAMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.pilotageSupervision.menuCardsTitle"
    subtitleKey="sections.pilotageSupervision.menuCardsSubtitle"
    subtitleValues={{ pages: items[0]!.subSections.length }}
    items={items}
  />
);
