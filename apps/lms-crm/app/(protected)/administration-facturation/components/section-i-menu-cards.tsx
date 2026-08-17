'use client';

import {
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Wallet,
} from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'administration-facturation-budget',
    path: '/administration-facturation/finance/budget',
    descriptionKey: 'sections.administrationFacturation.cards.budget',
    icon: Wallet,
    backgroundImage: 'bg-3',
    subSections: ['lignes', 'suivi'],
    tone: 'emerald' as const,
  },
  {
    moduleKey: 'administration-facturation-devis',
    path: '/administration-facturation/finance/devis',
    descriptionKey: 'sections.administrationFacturation.cards.devis',
    icon: FileText,
    backgroundImage: 'bg-3',
    subSections: ['pipeline', 'plaquettes'],
    tone: 'sky' as const,
  },
  {
    moduleKey: 'administration-facturation-factures',
    path: '/administration-facturation/finance/factures',
    descriptionKey: 'sections.administrationFacturation.cards.factures',
    icon: FileSpreadsheet,
    backgroundImage: 'bg-3',
    subSections: ['emission', 'relances'],
    tone: 'violet' as const,
  },
  {
    moduleKey: 'administration-facturation-paiements',
    path: '/administration-facturation/finance/paiements',
    descriptionKey: 'sections.administrationFacturation.cards.paiements',
    icon: CreditCard,
    backgroundImage: 'bg-3',
    subSections: ['encaissements', 'reconciliation'],
    tone: 'amber' as const,
  },
  {
    moduleKey: 'administration-facturation-rapports',
    path: '/administration-facturation/finance/rapports',
    descriptionKey: 'sections.administrationFacturation.cards.rapports',
    icon: BarChart3,
    backgroundImage: 'bg-3',
    subSections: ['tableaux', 'exports'],
    tone: 'rose' as const,
  },
];

export const AdminMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.administrationFacturation.menuCardsTitle"
    subtitleKey="sections.administrationFacturation.menuCardsSubtitle"
    subtitleValues={{ pages: items.length }}
    items={items}
  />
);
