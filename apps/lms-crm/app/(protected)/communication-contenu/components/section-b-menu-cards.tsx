'use client';

import { LayoutTemplate, Megaphone, Search } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

const items = [
  {
    moduleKey: 'communication-contenu-cms',
    path: '/communication-contenu/cms',
    descriptionKey: 'sections.communicationContenu.cards.cms',
    icon: LayoutTemplate,
    backgroundImage: 'bg-3',
    subSections: ['pages-landing', 'equipe-landing', 'contenus'],
    subSectionPaths: [
      '/communication-contenu/cms/pages-landing',
      '/communication-contenu/cms/equipe-landing',
      '/communication-contenu/cms/contenus',
    ],
    tone: 'violet' as const,
  },
  {
    moduleKey: 'communication-contenu-marketing',
    path: '/communication-contenu/marketing',
    descriptionKey: 'sections.communicationContenu.cards.marketing',
    icon: Megaphone,
    backgroundImage: 'bg-3',
    subSections: ['formulaires-leads', 'campagnes'],
    subSectionPaths: [
      '/communication-contenu/marketing/formulaires-leads',
      '/communication-contenu/marketing/campagnes',
    ],
    tone: 'fuchsia' as const,
  },
  {
    moduleKey: 'communication-contenu-seo',
    path: '/communication-contenu/seo',
    descriptionKey: 'sections.communicationContenu.cards.seo',
    icon: Search,
    backgroundImage: 'bg-3',
    subSections: ['meta-indexation', 'redirections'],
    subSectionPaths: [
      '/communication-contenu/seo/meta-indexation',
      '/communication-contenu/seo/redirections',
    ],
    tone: 'teal' as const,
  },
];

export const SectionBMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.communicationContenu.menuCardsTitle"
    subtitleKey="sections.communicationContenu.menuCardsSubtitle"
    subtitleValues={{
      modules: items.length,
      pages: items.reduce((total, item) => total + item.subSections.length, 0),
    }}
    items={items}
  />
);
