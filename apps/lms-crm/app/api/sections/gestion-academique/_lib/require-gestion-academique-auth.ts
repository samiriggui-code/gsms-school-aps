import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function requireGestionAcademiqueView() {
  return requireCrmApiAuth(CRM_PERMISSION.academiqueView);
}

export async function requireGestionAcademiqueEdit() {
  return requireCrmApiAuth(CRM_PERMISSION.academiqueEdit);
}

export async function requireGestionAcademiqueForMethod(method: string) {
  return READ_METHODS.has(method.toUpperCase())
    ? requireGestionAcademiqueView()
    : requireGestionAcademiqueEdit();
}
