import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getGlobalComplianceUserDetail } from '@/lib/governance/global-user-compliance';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.conformiteView)) {
    return fail('Forbidden', 403);
  }

  const { id } = await params;

  try {
    const detail = await getGlobalComplianceUserDetail(id);
    if (!detail) return fail('Profil introuvable.', 404);
    return ok(detail);
  } catch (e) {
    return fail('Impossible de charger le détail conformité.', 500, e);
  }
}
