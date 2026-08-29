import type { Session } from 'next-auth';
import type { PermissionPrincipal } from '@repo/doctype';
import { isSuperAdminRole } from '@/lib/auth/crm-permissions';

export function principalFromSession(session: Session): PermissionPrincipal {
  const slugs = session.user?.permissionSlugs ?? [];
  const roleSlug = session.user?.roleSlug ?? null;
  return {
    id: session.user?.id ?? '',
    roleSlug,
    permissionSlugs: new Set(slugs),
    isSystemManager: isSuperAdminRole(roleSlug),
  };
}
