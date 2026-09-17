'use client';

import { Building2, FileText, Wallet } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

/** Cartes modules de la section Finance (3 modules, vague 3). */
const items = [
  {
    moduleKey: 'administration-facturation-finance',
    path: '/administration-facturation/finance',
    descriptionKey: 'sections.administrationFacturation.cards.devisFacturation',
    icon: FileText,
    backgroundImage: 'bg-3',
    subSections: ['devis', 'factures', 'paiements'],
    subSectionPaths: [
      '/administration-facturation/finance/devis',
      '/administration-facturation/finance/factures',
      '/administration-facturation/finance/paiements',
    ],
    tone: 'sky' as const,
  },
  {
    moduleKey: 'administration-facturation-financeurs',
    path: '/administration-facturation/financeurs',
    descriptionKey: 'sections.administrationFacturation.cards.financeurs',
    icon: Building2,
    backgroundImage: 'bg-3',
    subSections: ['financeurs', 'edof-catalog'],
    subSectionPaths: [
      '/administration-facturation/finance/financeurs',
      '/administration-facturation/finance/edof-catalog',
    ],
    tone: 'cyan' as const,
  },
  {
    moduleKey: 'administration-facturation-budget',
    path: '/administration-facturation/budget',
    descriptionKey: 'sections.administrationFacturation.cards.budgetPilotage',
    icon: Wallet,
    backgroundImage: 'bg-3',
    subSections: ['budget', 'bpf', 'rapports'],
    subSectionPaths: [
      '/administration-facturation/finance/budget',
      '/administration-facturation/finance/bpf',
      '/administration-facturation/finance/rapports',
    ],
    tone: 'emerald' as const,
  },
];

export const AdminMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.administrationFacturation.menuCardsTitle"
    subtitleKey="sections.administrationFacturation.menuCardsSubtitle"
    subtitleValues={{
      modules: items.length,
      pages: items.reduce((total, item) => total + item.subSections.length, 0),
    }}
    items={items}
  />
);
