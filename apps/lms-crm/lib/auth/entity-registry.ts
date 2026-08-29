import {
  CRM_PERMISSION,
  IAM_PERMISSION,
  LMS_PERMISSION,
} from '@/lib/auth/crm-permissions';
import type { EntityMethod } from '@/lib/framework/entity';

/**
 * Registre permission-only (méthode HTTP → slug).
 * Fail-closed : entité ou méthode absente → null → 403.
 * Ne jamais ajouter de fallback permissif.
 */
export const ENTITY_REGISTRY: Record<string, Partial<Record<EntityMethod, string>>> = {
  user: {
    GET: IAM_PERMISSION.usersView,
    POST: IAM_PERMISSION.usersCreate,
    PATCH: IAM_PERMISSION.usersEdit,
    DELETE: IAM_PERMISSION.usersDelete,
  },
  role: {
    GET: IAM_PERMISSION.rolesView,
    POST: IAM_PERMISSION.rolesEdit,
    PATCH: IAM_PERMISSION.rolesEdit,
    DELETE: IAM_PERMISSION.rolesEdit,
  },
  course: {
    GET: LMS_PERMISSION.courseView,
    POST: LMS_PERMISSION.contentDraft,
    PATCH: LMS_PERMISSION.contentDraft,
    DELETE: LMS_PERMISSION.catalogManage,
  },
  lesson: {
    GET: LMS_PERMISSION.courseView,
    POST: LMS_PERMISSION.contentDraft,
    PATCH: LMS_PERMISSION.contentDraft,
    DELETE: LMS_PERMISSION.contentDraft,
  },
  enrollment: {
    GET: LMS_PERMISSION.courseView,
    POST: LMS_PERMISSION.courseProgress,
    PATCH: LMS_PERMISSION.courseProgress,
    DELETE: LMS_PERMISSION.catalogManage,
  },
  leaveRequest: {
    GET: CRM_PERMISSION.ressourcesView,
    POST: CRM_PERMISSION.ressourcesEdit,
    PATCH: CRM_PERMISSION.ressourcesEdit,
    DELETE: CRM_PERMISSION.ressourcesEdit,
  },
  complianceDossierItem: {
    GET: CRM_PERMISSION.ressourcesView,
    POST: CRM_PERMISSION.ressourcesEdit,
    PATCH: CRM_PERMISSION.ressourcesEdit,
    DELETE: CRM_PERMISSION.ressourcesEdit,
  },
};

export function permissionForEntityMethod(
  entity: string,
  method: EntityMethod,
): string | null {
  const entry = ENTITY_REGISTRY[entity];
  if (!entry) return null;
  return entry[method] ?? null;
}
