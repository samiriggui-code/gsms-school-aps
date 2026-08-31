import type { Session } from 'next-auth';
import {
  CRM_PERMISSION,
  GOVERNANCE_PERMISSION,
  LMS_PERMISSION,
  sessionHasAnyPermission,
  sessionHasPermission,
} from '@/lib/auth/crm-permissions';

/** Modules réellement utilisés par les appels `/api/common/files` (UI + services). */
const MODULE_VIEW_PERMISSIONS: Record<string, string[]> = {
  'gestion-ressources': [CRM_PERMISSION.ressourcesView, CRM_PERMISSION.ressourcesEdit],
  'administration-facturation': [CRM_PERMISSION.financeView, CRM_PERMISSION.financeEdit],
  crm: [CRM_PERMISSION.ressourcesView, CRM_PERMISSION.ressourcesEdit],
  COMPANY_ADMIN_DOCS: [CRM_PERMISSION.ressourcesView, CRM_PERMISSION.ressourcesEdit],
  'gestion-academique': [CRM_PERMISSION.academiqueView, CRM_PERMISSION.academiqueEdit],
  pilotage: [CRM_PERMISSION.pilotageView],
  'vie-scolaire': [CRM_PERMISSION.academiqueView, CRM_PERMISSION.academiqueEdit],
  lms: [LMS_PERMISSION.courseView, LMS_PERMISSION.catalogManage],
  qualiopi: [
    GOVERNANCE_PERMISSION.conformiteView,
    GOVERNANCE_PERMISSION.conformiteEdit,
    CRM_PERMISSION.ressourcesView,
  ],
};

const MODULE_EDIT_PERMISSIONS: Record<string, string[]> = {
  'gestion-ressources': [CRM_PERMISSION.ressourcesEdit],
  'administration-facturation': [CRM_PERMISSION.financeEdit],
  crm: [CRM_PERMISSION.ressourcesEdit],
  COMPANY_ADMIN_DOCS: [CRM_PERMISSION.ressourcesEdit],
  'gestion-academique': [CRM_PERMISSION.academiqueEdit],
  pilotage: [CRM_PERMISSION.pilotageView],
  'vie-scolaire': [CRM_PERMISSION.academiqueEdit],
  lms: [LMS_PERMISSION.contentDraft, LMS_PERMISSION.catalogManage],
  qualiopi: [GOVERNANCE_PERMISSION.conformiteEdit, CRM_PERMISSION.ressourcesEdit],
};

export function canAccessFilesModule(
  session: Session | null | undefined,
  moduleName: string,
  mode: 'view' | 'edit',
): boolean {
  if (!session?.user) return false;
  if (sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)) return true;
  const key = moduleName.trim();
  const map = mode === 'edit' ? MODULE_EDIT_PERMISSIONS : MODULE_VIEW_PERMISSIONS;
  const slugs = map[key];
  if (!slugs?.length) return false;
  return sessionHasAnyPermission(session, slugs);
}

/** Liste blanche mime — GED école (PDF / images / Office courant). */
export const COMMON_FILES_ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]);

/** 40 Mo — aligné usage RH / Qualiopi / finance. */
export const COMMON_FILES_MAX_BYTES = 40 * 1024 * 1024;

/**
 * Visibilité pour la liste GET : jamais exposer PRIVATE cross-user.
 * PUBLIC / INTERNAL OK si le module est déjà autorisé.
 */
export function canListFileAssetRow(
  session: Session | null | undefined,
  asset: { visibility: string; createdById: string | null },
): boolean {
  if (!session?.user) return false;
  if (asset.visibility === 'PUBLIC' || asset.visibility === 'INTERNAL') return true;
  if (sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)) return true;
  return Boolean(asset.createdById) && asset.createdById === session.user.id;
}
