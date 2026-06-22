/** Segments de la liste RH Collaborateurs (alignés sur `profileType` API). */
export type RhCollaborateurListSegment = 'collaborateur' | 'direction' | 'interne';

export const RH_COLLABORATEUR_LIST_SEGMENT_LABELS: Record<RhCollaborateurListSegment, string> = {
  collaborateur: 'Salariés (collaborateurs)',
  direction: "Direction de l'école",
  interne: 'Autres comptes siège / admin',
};

export const RH_COLLABORATEUR_LIST_SEGMENT_HINTS: Record<RhCollaborateurListSegment, string> = {
  collaborateur:
    'Comptes rôle « Collaborateur » (pôles pédagogie, RH…) — hors équipe de direction.',
  direction:
    "Directeur, adjoint, RAF et équipe de pilotage — pôle interne Direction (voir aussi Structure → Direction).",
  interne: 'Comptes admin / superadmin du siège, hors direction et hors rôle collaborateur.',
};
