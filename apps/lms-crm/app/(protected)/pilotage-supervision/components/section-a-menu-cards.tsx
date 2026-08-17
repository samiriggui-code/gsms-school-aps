'use client';

import { Activity, BarChart3, FileDown, ShieldAlert } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

/** Accès rapide aux 4 espaces Pilotage (ordre = menu latéral). */
export const SectionAMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.pilotageSupervision.menuCardsTitle"
    subtitleKey="sections.pilotageSupervision.menuCardsSubtitle"
    items={[
      {
        moduleKey: 'pilotage-alertes',
        path: '/pilotage-supervision/pilotage/alertes',
        descriptionKey: 'sections.pilotageSupervision.cards.alertes',
        icon: Activity,
        backgroundImage: 'bg-3',
        subSections: ['registre', 'filtres'],
        tone: 'cyan',
      },
      {
        moduleKey: 'pilotage-indicateurs',
        path: '/pilotage-supervision/pilotage/indicateurs',
        descriptionKey: 'sections.pilotageSupervision.cards.indicateurs',
        icon: BarChart3,
        backgroundImage: 'bg-3',
        subSections: ['kpi', 'graphiques'],
        tone: 'sky',
      },
      {
        moduleKey: 'pilotage-rapports',
        path: '/pilotage-supervision/pilotage/rapports',
        descriptionKey: 'sections.pilotageSupervision.cards.rapports',
        icon: FileDown,
        backgroundImage: 'bg-3',
        subSections: ['exports', 'planifications'],
        tone: 'violet',
      },
      {
        moduleKey: 'pilotage-risques',
        path: '/pilotage-supervision/pilotage/risques',
        descriptionKey: 'sections.pilotageSupervision.cards.risques',
        icon: ShieldAlert,
        backgroundImage: 'bg-3',
        subSections: ['registre', 'gravite'],
        tone: 'amber',
      },
    ]}
  />
);
