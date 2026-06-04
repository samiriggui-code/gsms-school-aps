export const Planning_ACTIVITY_EVENT = 'planning.activity';

export function getPlanningActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.planning.${safeItemId}.activity`;
}
