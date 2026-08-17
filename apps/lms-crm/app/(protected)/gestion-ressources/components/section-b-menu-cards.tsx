'use client';

import { Building, Wrench, Users } from 'lucide-react';
import { SectionMenuCardsShell } from '@/components/common/section-menu-cards-shell';

export const SectionBMenuCards = () => (
  <SectionMenuCardsShell
    titleKey="sections.gestionRessources.menuCardsTitle"
    subtitleKey="sections.gestionRessources.menuCardsSubtitle"
    items={[
      {
        moduleKey: 'gestion-ressources-compagnie',
        path: '/gestion-ressources/compagnie',
        descriptionKey: 'sections.gestionRessources.cards.compagnie',
        icon: Building,
        backgroundImage: 'bg-3',
        subSections: ['profil', 'structure', 'documents'],
        tone: 'sky',
      },
      {
        moduleKey: 'gestion-ressources-rh',
        path: '/gestion-ressources/rh',
        descriptionKey: 'sections.gestionRessources.cards.rh',
        icon: Users,
        backgroundImage: 'bg-3',
        subSections: ['collaborateurs', 'equipes', 'formateurs', 'absences', 'candidatures'],
        tone: 'rose',
      },
      {
        moduleKey: 'gestion-ressources-equipements',
        path: '/gestion-ressources/equipements',
        descriptionKey: 'sections.gestionRessources.cards.equipements',
        icon: Wrench,
        backgroundImage: 'bg-3',
        subSections: ['inventaire', 'affectations', 'maintenance', 'salles'],
        tone: 'amber',
      },
    ]}
  />
);
