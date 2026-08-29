'use client';

import { Building, ShieldCheck, Wrench, Users } from 'lucide-react';
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
        subSectionPaths: [
          '/gestion-ressources/compagnie/profil',
          '/gestion-ressources/compagnie/structure',
          '/gestion-ressources/compagnie/documents',
        ],
        tone: 'sky',
      },
      {
        moduleKey: 'gestion-ressources-qualiopi',
        path: '/gestion-ressources/qualiopi',
        descriptionKey: 'sections.gestionRessources.cards.qualiopi',
        icon: ShieldCheck,
        backgroundImage: 'bg-4',
        subSections: ['classeur', 'historique'],
        subSectionPaths: [
          '/gestion-ressources/qualiopi/classeur',
          '/gestion-ressources/qualiopi/historique',
        ],
        tone: 'emerald',
      },
      {
        moduleKey: 'gestion-ressources-rh',
        path: '/gestion-ressources/rh',
        descriptionKey: 'sections.gestionRessources.cards.rh',
        icon: Users,
        backgroundImage: 'bg-3',
        subSections: ['collaborateurs', 'equipes', 'formateurs', 'absences'],
        subSectionPaths: [
          '/gestion-ressources/rh/collaborateurs',
          '/gestion-ressources/rh/equipes',
          '/gestion-ressources/rh/formateurs',
          '/gestion-ressources/rh/absences',
        ],
        tone: 'rose',
      },
      {
        moduleKey: 'gestion-ressources-equipements',
        path: '/gestion-ressources/equipements',
        descriptionKey: 'sections.gestionRessources.cards.equipements',
        icon: Wrench,
        backgroundImage: 'bg-3',
        subSections: ['inventaire', 'affectations', 'maintenance', 'salles'],
        subSectionPaths: [
          '/gestion-ressources/equipements/inventaire',
          '/gestion-ressources/equipements/affectations',
          '/gestion-ressources/equipements/maintenance',
          '/gestion-ressources/equipements/salles',
        ],
        tone: 'amber',
      },
    ]}
  />
);
