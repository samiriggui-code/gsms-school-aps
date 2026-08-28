'use client';

import { ClipboardList, FileText, ShieldCheck, Workflow } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
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
    moduleKey: 'support-qualite-satisfaction',
    path: '/support-qualite/docs-circuits/satisfaction',
    descriptionKey: 'sections.supportQualite.cards.satisfaction',
    icon: ClipboardList,
    backgroundImage: 'bg-2',
    subSections: ['enquetes'],
    tone: 'cyan' as const,
  },
  {
    moduleKey: 'support-qualite-circuits',
    path: '/support-qualite/docs-circuits/circuits',
    descriptionKey: 'sections.supportQualite.cards.circuits',
    icon: Workflow,
    backgroundImage: 'bg-3',
    subSections: ['jalons'],
    tone: 'violet' as const,
  },
  {
    moduleKey: 'support-qualite-sessions-docs',
    path: '/gestion-academique/vie-scolaire/sessions',
    descriptionKey: 'sections.supportQualite.cards.docs',
    icon: FileText,
    backgroundImage: 'bg-1',
    subSections: ['pdf'],
    tone: 'amber' as const,
  },
];

/** Cartes hub OF-08 — Qualiopi · Satisfaction · Circuits · Docs session. */
export function DocsCircuitsMenuCards() {
  return (
    <SectionMenuCardsShell
      titleKey="sections.supportQualite.docsCircuitsTitle"
      subtitleKey="sections.supportQualite.docsCircuitsSubtitle"
      subtitleValues={{ modules: items.length }}
      items={items}
    />
  );
}
