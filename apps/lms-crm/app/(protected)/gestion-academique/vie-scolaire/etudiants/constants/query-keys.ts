/** React Query — page « Candidature » (liste rôle apprenant / ancien libellé Étudiants). */
export const etudiantsListQueryKey = ['gestion-academique', 'vie-scolaire', 'etudiants', 'list'] as const;

export const etudiantsStatsQueryKey = ['gestion-academique', 'vie-scolaire', 'etudiants', 'stats'] as const;

export const candidaturesListQueryKey = ['gestion-academique', 'vie-scolaire', 'candidatures', 'list'] as const;

export const candidaturesStatsQueryKey = ['gestion-academique', 'vie-scolaire', 'candidatures', 'stats'] as const;

/** Hub unifié : candidats + élèves, dossier CRM et inscriptions session sur une même liste. */
export const candidatHubListQueryKey = ['gestion-academique', 'vie-scolaire', 'candidat-hub', 'list'] as const;

export const candidatHubStatsQueryKey = ['gestion-academique', 'vie-scolaire', 'candidat-hub', 'stats'] as const;

export const candidatHubDetailQueryKey = ['gestion-academique', 'vie-scolaire', 'candidat-hub', 'detail'] as const;
