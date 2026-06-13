import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { buildCrmDashboard } from '@/lib/crm/crm-dashboard-data';

export async function GET() {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.dashboard);
  if (!auth.ok) return auth.response;

  try {
    const payload = await buildCrmDashboard();
    return ok({
      ...payload,
      user: {
        name: auth.session.user.name ?? null,
        roleSlug: auth.session.user.roleSlug ?? null,
        roleName: auth.session.user.roleName ?? null,
      },
    });
  } catch (e) {
    return fail('Impossible de charger le tableau de bord CRM.', 500, e);
  }
}
