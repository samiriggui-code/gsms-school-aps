'use client';

import { ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

export const QualiopiMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.qualiopi.menuCardsTitle"
    subtitleKey="sections.qualiopi.menuCardsSubtitle"
    items={[
      {
        moduleKey: 'qualiopi-referentiel',
        path: '/qualiopi/referentiel',
        descriptionKey: 'sections.qualiopi.cards.referentiel',
        icon: ShieldCheck,
        backgroundImage: 'bg-3',
        subSections: ['passeport', 'classeur', 'couverture', 'historique', 'ecarts'],
        subSectionPaths: [
          '/qualiopi/referentiel/passeport',
          '/qualiopi/referentiel/classeur',
          '/qualiopi/referentiel/couverture',
          '/qualiopi/referentiel/historique',
          '/qualiopi/referentiel/ecarts',
        ],
        tone: 'emerald',
      },
      {
        moduleKey: 'qualiopi-pilotage',
        path: '/qualiopi/pilotage',
        descriptionKey: 'sections.qualiopi.cards.pilotage',
        icon: TrendingUp,
        backgroundImage: 'bg-3',
        subSections: ['alertes', 'indicateurs', 'rapports'],
        subSectionPaths: [
          '/qualiopi/pilotage/alertes',
          '/qualiopi/pilotage/indicateurs',
          '/qualiopi/pilotage/rapports',
        ],
        tone: 'sky',
      },
      {
        moduleKey: 'qualiopi-ia',
        path: '/qualiopi/ia',
        descriptionKey: 'sections.qualiopi.cards.ia',
        icon: Sparkles,
        backgroundImage: 'bg-3',
        subSections: ['brouillons', 'historique'],
        subSectionPaths: ['/qualiopi/ia/brouillons', '/qualiopi/ia/historique'],
        tone: 'violet',
      },
    ]}
  />
);
