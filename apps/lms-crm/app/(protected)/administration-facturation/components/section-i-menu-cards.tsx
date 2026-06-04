'use client';

import { CreditCard } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'administration-facturation-finance',
    path: '/administration-facturation/finance',
    descriptionKey: 'sections.administrationFacturation.cards.finance',
    icon: CreditCard,
    backgroundImage: 'bg-3',
    subSections: ['budget', 'devis', 'factures', 'paiements', 'rapports'],
    tone: 'emerald' as const,
  },
];

export const AdminMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.administrationFacturation.menuCardsTitle"
    subtitleKey="sections.administrationFacturation.menuCardsSubtitle"
    subtitleValues={{ pages: items[0]!.subSections.length }}
    items={items}
  />
);
