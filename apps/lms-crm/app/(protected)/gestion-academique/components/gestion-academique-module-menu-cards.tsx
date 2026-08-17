'use client';

import { BookOpen, CalendarDays, CalendarRange, ClipboardList, Users } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

/** Accès rapide aux 5 espaces Vie scolaire (ordre = menu latéral). */
export function GestionAcademiqueModuleMenuCards() {
  return (
    <SectionMenuCardsShell
      titleKey="sections.gestionAcademique.menuCardsTitle"
      subtitleKey="sections.gestionAcademique.menuCardsSubtitle"
      items={[
        {
          moduleKey: 'vie-scolaire-formations',
          path: '/gestion-academique/vie-scolaire/formations',
          descriptionKey: 'sections.gestionAcademique.cards.formations',
          icon: BookOpen,
          backgroundImage: 'bg-3',
          subSections: ['catalogue', 'programmes'],
          tone: 'violet',
        },
        {
          moduleKey: 'vie-scolaire-sessions',
          path: '/gestion-academique/vie-scolaire/sessions',
          descriptionKey: 'sections.gestionAcademique.cards.sessions',
          icon: CalendarDays,
          backgroundImage: 'bg-3',
          subSections: ['planification', 'inscriptions'],
          tone: 'sky',
        },
        {
          moduleKey: 'vie-scolaire-planning',
          path: '/gestion-academique/vie-scolaire/planning',
          descriptionKey: 'sections.gestionAcademique.cards.planning',
          icon: CalendarRange,
          backgroundImage: 'bg-3',
          subSections: ['calendrier'],
          tone: 'amber',
        },
        {
          moduleKey: 'vie-scolaire-etudiants',
          path: '/gestion-academique/vie-scolaire/etudiants',
          descriptionKey: 'sections.gestionAcademique.cards.etudiants',
          icon: Users,
          backgroundImage: 'bg-3',
          subSections: ['candidatures', 'dossiers'],
          tone: 'rose',
        },
        {
          moduleKey: 'vie-scolaire-suivi-formations',
          path: '/gestion-academique/vie-scolaire/suivi-formations',
          descriptionKey: 'sections.gestionAcademique.cards.suiviFormations',
          icon: ClipboardList,
          backgroundImage: 'bg-3',
          subSections: ['stagiaires', 'examens', 'certifications', 'e-learning'],
          tone: 'emerald',
        },
      ]}
    />
  );
}
