'use client';

import { BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

/** Cartes modules de la section — 3 modules (Vie scolaire / LMS / Suivi formations, vague 3). */
export function GestionAcademiqueModuleMenuCards() {
  return (
    <SectionMenuCardsShell
      titleKey="sections.gestionAcademique.menuCardsTitle"
      subtitleKey="sections.gestionAcademique.menuCardsSubtitle"
      subtitleValues={{ modules: 3, pages: 15 }}
      items={[
        {
          moduleKey: 'gestion-academique-vie-scolaire',
          path: '/gestion-academique/vie-scolaire',
          descriptionKey: 'sections.gestionAcademique.cards.vieScolaire',
          icon: BookOpen,
          backgroundImage: 'bg-3',
          subSections: ['formations', 'sessions', 'planning', 'etudiants'],
          subSectionPaths: [
            '/gestion-academique/vie-scolaire/formations',
            '/gestion-academique/vie-scolaire/sessions',
            '/gestion-academique/vie-scolaire/planning',
            '/gestion-academique/vie-scolaire/etudiants',
          ],
          tone: 'violet',
        },
        {
          moduleKey: 'gestion-academique-lms',
          path: '/gestion-academique/lms',
          descriptionKey: 'sections.gestionAcademique.cards.lms',
          icon: GraduationCap,
          backgroundImage: 'bg-3',
          subSections: ['cours', 'devoirs', 'discussions', 'inscriptions'],
          subSectionPaths: [
            '/gestion-academique/lms/cours',
            '/gestion-academique/lms/devoirs',
            '/gestion-academique/lms/discussions',
            '/gestion-academique/lms/inscriptions',
          ],
          tone: 'sky',
        },
        {
          moduleKey: 'gestion-academique-suivi-formations',
          path: '/gestion-academique/suivi-formations',
          descriptionKey: 'sections.gestionAcademique.cards.suiviFormations',
          icon: ClipboardList,
          backgroundImage: 'bg-3',
          subSections: ['tableau', 'satisfaction', 'circuits'],
          subSectionPaths: [
            '/gestion-academique/suivi-formations/tableau',
            '/gestion-academique/suivi-formations/satisfaction',
            '/gestion-academique/suivi-formations/circuits',
          ],
          tone: 'emerald',
        },
      ]}
    />
  );
}
