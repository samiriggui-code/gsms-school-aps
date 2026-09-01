import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getGlobalComplianceStats } from '@/lib/governance/global-user-compliance';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.conformiteView)) {
    return fail('Forbidden', 403);
  }

  try {
    return ok(await getGlobalComplianceStats());
  } catch (e) {
    return fail('Impossible de charger les statistiques.', 500, e);
  }
}
