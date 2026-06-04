export const Etudiant_ACTIVITY_EVENT = 'etudiant.activity';

export function getEtudiantActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.etudiant.${safeItemId}.activity`;
}
