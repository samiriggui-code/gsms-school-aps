export const COLLABORATEUR_ACTIVITY_EVENT = 'collaborateur.activity';

/**
 * Construit le nom de canal activite collaborateur.
 * Garde la compatibilite avec les anciens composants RH.
 */
export function getCollaborateurActivityChannel(
  tenantId: string,
  collaborateurId: string,
) {
  const safeTenantId = String(tenantId || 'solo');
  const safeCollaborateurId = String(collaborateurId || 'unknown');
  return `tenant.${safeTenantId}.collaborateur.${safeCollaborateurId}.activity`;
}
