/** Textes d'introduction des pages pilotage (toolbar + bandeau contexte). */
export const PILOTAGE_PAGE_INTRO: Record<string, { lead: string; detail: string }> = {
  pilotage: {
    lead: "Hub de supervision — tous les modules CRM condensés en un seul écran.",
    detail:
      "Chaque carte résume workflows, indicateurs et statut opérationnel. Ouvrez la landing du module pour le détail complet, ou les pages Alertes / Indicateurs / Rapports / Risques pour le pilotage approfondi.",
  },
  alertes: {
    lead: 'Centre de supervision des alertes opérationnelles — même flux que la cloche du header.',
    detail:
      'Chaque ligne correspond à une notification in-app (événement CRM, conformité RH, salles, sessions). Filtrez par module, ouvrez le détail dans le panneau latéral et accédez directement au module concerné.',
  },
  indicateurs: {
    lead: 'Indicateurs opérationnels du module sélectionné — KPI, tendances et répartitions.',
    detail:
      "Les graphiques reflètent les données live (RH, parc matériel, salles, charge opérationnelle). Changez l'onglet module ou la période pour recalculer les indicateurs — pas de raccourcis navigation ici.",
  },
  rapports: {
    lead: 'Centre de génération documentaire — PDF professionnels et exports CSV.',
    detail:
      "Choisissez la période (jour, semaine, mois, année), générez un PDF avec KPI et graphiques (worker Playwright) ou un CSV tabulaire. Historique stocké, imprimable et téléchargeable.",
  },
  risques: {
    lead: "Registre des risques et exposition opérationnelle — anticiper les blocages de l'école.",
    detail:
      "Gravité, exposition chiffrée et mesures correctives par domaine (RH, équipements, salles). Cliquez sur une ligne pour la recommandation détaillée et le lien vers l'action.",
  },
};
