'use client';

import { GraduationCap } from 'lucide-react';
import { MenuCard, menuCardPagesBadge } from '@/components/common/menu-card';

/** Carte unique du module Vie scolaire sur l’atterrissage de la section Gestion académique (sans liste de pages). */
export function GestionAcademiqueModuleMenuCards() {
  return (
    <div className="grid gap-5 lg:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Accès au module</h2>
        <p className="text-muted-foreground">
          Section Gestion académique — entrée du module Vie scolaire (six espaces listés dans le menu latéral)
        </p>
      </div>

      {/* Même grille que les atterrissages section : 3 cartes / ligne en lg ; une carte = 1/3 largeur, pas d’élargissement artificiel */}
      <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-start">
        <MenuCard
          moduleKey="vie-scolaire"
          title="Vie scolaire"
          description="Pilotage pédagogique et administratif : catalogue, sessions, candidatures, calendrier, examens et certifications. Utilisez le menu pour ouvrir chaque espace."
          icon={GraduationCap}
          path="/gestion-academique/vie-scolaire"
          badge={menuCardPagesBadge(6)}
          backgroundImage="bg-3"
          tone="violet"
        />
      </div>
    </div>
  );
}
