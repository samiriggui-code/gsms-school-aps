import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import {
  hasAnyPermissionSlug,
  isSuperAdminRole,
  sessionHasPermission,
} from '@/lib/auth/crm-permissions';

export { sessionHasPermission };

type AuthOk = { ok: true; session: Session };
type AuthFail = { ok: false; response: ReturnType<typeof fail> };

export async function requireCrmApiAuth(
  required?: string | string[],
): Promise<AuthOk | AuthFail> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, response: fail('Unauthorized request', 401) };
  }

  if (isSuperAdminRole(session.user.roleSlug)) {
    return { ok: true, session };
  }

  if (!required) {
    return { ok: true, session };
  }

  const slugs = session.user.permissionSlugs ?? [];
  const requiredList = Array.isArray(required) ? required : [required];
  if (hasAnyPermissionSlug(slugs, requiredList)) {
    return { ok: true, session };
  }

  return { ok: false, response: fail('Forbidden', 403) };
}
