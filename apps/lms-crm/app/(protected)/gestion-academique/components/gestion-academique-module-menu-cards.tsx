'use client';

import { BookOpen, ClipboardList } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

/** Cartes modules de la section — Accéder vers hubs ; puces = pages (liens). */
export function GestionAcademiqueModuleMenuCards() {
  return (
    <SectionMenuCardsShell
      titleKey="sections.gestionAcademique.menuCardsTitle"
      subtitleKey="sections.gestionAcademique.menuCardsSubtitle"
      items={[
        {
          moduleKey: 'gestion-academique-vie-scolaire',
          path: '/gestion-academique/vie-scolaire',
          descriptionKey: 'sections.gestionAcademique.cards.vieScolaire',
          icon: BookOpen,
          backgroundImage: 'bg-3',
          subSections: ['formations', 'cours', 'inscriptions', 'sessions', 'planning', 'etudiants'],
          subSectionPaths: [
            '/gestion-academique/vie-scolaire/formations',
            '/gestion-academique/vie-scolaire/cours',
            '/gestion-academique/vie-scolaire/inscriptions-lms',
            '/gestion-academique/vie-scolaire/sessions',
            '/gestion-academique/vie-scolaire/planning',
            '/gestion-academique/vie-scolaire/etudiants',
          ],
          tone: 'violet',
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
