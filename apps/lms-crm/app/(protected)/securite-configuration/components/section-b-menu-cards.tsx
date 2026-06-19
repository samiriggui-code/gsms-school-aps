'use client';

import { Database, KeyRound, Settings } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'securite-configuration-acces',
    path: '/securite-configuration/acces',
    descriptionKey: 'sections.securiteConfiguration.cards.acces',
    icon: KeyRound,
    backgroundImage: 'bg-3',
    subSections: ['users', 'roles', 'permissions', 'logs'],
    tone: 'rose' as const,
  },
  {
    moduleKey: 'securite-configuration-parametres',
    path: '/securite-configuration/parametres',
    descriptionKey: 'sections.securiteConfiguration.cards.parametres',
    icon: Settings,
    backgroundImage: 'bg-3',
    subSections: ['settings', 'sante-systeme'],
    tone: 'sky' as const,
  },
  {
    moduleKey: 'securite-configuration-gouvernance-donnees',
    path: '/securite-configuration/gouvernance-donnees',
    descriptionKey: 'sections.securiteConfiguration.cards.gouvernance',
    icon: Database,
    backgroundImage: 'bg-3',
    subSections: [
      'conformite',
      'storage',
      'demandes-documents',
      'corbeille-archivage',
      'audit-documentaire',
    ],
    tone: 'indigo' as const,
  },
];

export const SectionBMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.securiteConfiguration.menuCardsTitle"
    subtitleKey="sections.securiteConfiguration.menuCardsSubtitle"
    subtitleValues={{
      modules: items.length,
      pages: items.reduce((total, item) => total + item.subSections.length, 0),
    }}
    items={items}
  />
);
