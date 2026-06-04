'use client';

import {
  BookOpen,
  CalendarDays,
  Users,
  CalendarRange,
  ClipboardCheck,
  Award,
} from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

export const SectionBMenuCards = () => (
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
        subSections: ['catalogue', 'parcours'],
        tone: 'violet',
      },
      {
        moduleKey: 'vie-scolaire-sessions',
        path: '/gestion-academique/vie-scolaire/sessions',
        descriptionKey: 'sections.gestionAcademique.cards.sessions',
        icon: CalendarDays,
        backgroundImage: 'bg-3',
        subSections: ['planification', 'suivi'],
        tone: 'cyan',
      },
      {
        moduleKey: 'vie-scolaire-etudiants',
        path: '/gestion-academique/vie-scolaire/etudiants',
        descriptionKey: 'sections.gestionAcademique.cards.etudiants',
        icon: Users,
        backgroundImage: 'bg-3',
        subSections: ['inscriptions', 'suivi'],
        tone: 'teal',
      },
      {
        moduleKey: 'vie-scolaire-planning',
        path: '/gestion-academique/vie-scolaire/planning',
        descriptionKey: 'sections.gestionAcademique.cards.planning',
        icon: CalendarRange,
        backgroundImage: 'bg-3',
        subSections: ['vue-globale', 'progression', 'assiduite'],
        tone: 'amber',
      },
      {
        moduleKey: 'vie-scolaire-examens',
        path: '/gestion-academique/vie-scolaire/examens',
        descriptionKey: 'sections.gestionAcademique.cards.examens',
        icon: ClipboardCheck,
        backgroundImage: 'bg-3',
        subSections: ['sessions-examen', 'resultats'],
        tone: 'rose',
      },
      {
        moduleKey: 'vie-scolaire-certifications',
        path: '/gestion-academique/vie-scolaire/certifications',
        descriptionKey: 'sections.gestionAcademique.cards.certifications',
        icon: Award,
        backgroundImage: 'bg-3',
        subSections: ['verification', 'edition'],
        tone: 'emerald',
      },
    ]}
  />
);
