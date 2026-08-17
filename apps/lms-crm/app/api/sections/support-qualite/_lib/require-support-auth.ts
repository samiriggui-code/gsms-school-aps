import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

export async function requireSupportView() {
  return requireCrmApiAuth(CRM_PERMISSION.supportView);
}

export async function requireSupportEdit() {
  return requireCrmApiAuth(CRM_PERMISSION.supportEdit);
}
