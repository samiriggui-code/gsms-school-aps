export const Certification_ACTIVITY_EVENT = 'certification.activity';

export function getCertificationActivityChannel(tenantId: string, itemId: string) {
  const safeTenantId = String(tenantId || 'solo');
  const safeItemId = String(itemId || 'unknown');
  return `tenant.${safeTenantId}.certification.${safeItemId}.activity`;
}
