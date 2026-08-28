'use client';

import { FolderKanban, LifeBuoy, ShieldCheck } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'support-qualite-support',
    path: '/support-qualite/support',
    descriptionKey: 'sections.supportQualite.cards.support',
    icon: LifeBuoy,
    backgroundImage: 'bg-3',
    subSections: ['tickets', 'incidents'],
    tone: 'cyan' as const,
  },
  {
    moduleKey: 'support-qualite-qualiopi',
    path: '/support-qualite/qualiopi',
    descriptionKey: 'sections.supportQualite.cards.qualiopi',
    icon: ShieldCheck,
    backgroundImage: 'bg-4',
    subSections: ['classeur'],
    tone: 'emerald' as const,
  },
  {
    moduleKey: 'support-qualite-docs-circuits',
    path: '/support-qualite/docs-circuits',
    descriptionKey: 'sections.supportQualite.cards.docsCircuits',
    icon: FolderKanban,
    backgroundImage: 'bg-2',
    subSections: ['satisfaction', 'circuits'],
    tone: 'violet' as const,
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
