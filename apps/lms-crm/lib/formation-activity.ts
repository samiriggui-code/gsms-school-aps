export const Formation_ACTIVITY_EVENT = 'formation.activity';

export function getFormationActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.formation.${safeItemId}.activity`;
}
