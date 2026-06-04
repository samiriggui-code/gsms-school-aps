export const Candidat_ACTIVITY_EVENT = 'candidat.activity';

export function getCandidatActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.candidat.${safeItemId}.activity`;
}
