export const CONFORMITE_ACTIVITY_EVENT = 'conformite.activity';

/**
 * Construit le nom de canal activite conformite.
 */
export function getConformiteActivityChannel(
  tenantId: string,
  conformiteId: string,
) {
  const safeTenantId = String(tenantId || 'solo');
  const safeConformiteId = String(conformiteId || 'unknown');
  return `tenant.${safeTenantId}.conformite.${safeConformiteId}.activity`;
}
