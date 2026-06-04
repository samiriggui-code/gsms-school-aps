export const INVENTAIRE_ACTIVITY_EVENT = 'inventaire.activity';

/**
 * Construit le nom de canal activite inventaire.
 */
export function getInventaireActivityChannel(
  tenantId: string,
  inventaireId: string,
) {
  const safeTenantId = String(tenantId || 'solo');
  const safeInventaireId = String(inventaireId || 'unknown');
  return `tenant.${safeTenantId}.inventaire.${safeInventaireId}.activity`;
}
