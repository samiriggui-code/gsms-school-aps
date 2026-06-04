export const SessionInscription_ACTIVITY_EVENT = 'session-inscription.activity';

export function getSessionInscriptionActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.session-inscription.${safeItemId}.activity`;
}
