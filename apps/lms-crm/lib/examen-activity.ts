export const Examen_ACTIVITY_EVENT = 'examen.activity';

export function getExamenActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.examen.${safeItemId}.activity`;
}
