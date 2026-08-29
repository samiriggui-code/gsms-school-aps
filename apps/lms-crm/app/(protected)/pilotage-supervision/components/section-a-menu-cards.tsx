'use client';

import { Activity, Bot } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

/** Cartes modules section — Accéder vers hubs ; puces = pages (liens). */
export const SectionAMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.pilotageSupervision.menuCardsTitle"
    subtitleKey="sections.pilotageSupervision.menuCardsSubtitle"
    items={[
      {
        moduleKey: 'pilotage-supervision-pilotage',
        path: '/pilotage-supervision/pilotage',
        descriptionKey: 'sections.pilotageSupervision.cards.pilotage',
        icon: Activity,
        backgroundImage: 'bg-3',
        subSections: ['alertes', 'indicateurs', 'rapports', 'risques'],
        subSectionPaths: [
          '/pilotage-supervision/pilotage/alertes',
          '/pilotage-supervision/pilotage/indicateurs',
          '/pilotage-supervision/pilotage/rapports',
          '/pilotage-supervision/pilotage/risques',
        ],
        tone: 'cyan',
      },
      {
        moduleKey: 'pilotage-supervision-ia',
        path: '/pilotage-supervision/ia',
        descriptionKey: 'sections.pilotageSupervision.cards.ia',
        icon: Bot,
        backgroundImage: 'bg-4',
        subSections: ['brouillons', 'historique'],
        subSectionPaths: [
          '/pilotage-supervision/ia/brouillons',
          '/pilotage-supervision/ia/historique',
        ],
        tone: 'violet',
      },
    ]}
  />
);
