export const StatutAdministratif_ACTIVITY_EVENT = 'statut-administratif.activity';

export function getStatutAdministratifActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.statut-administratif.${safeItemId}.activity`;
}
