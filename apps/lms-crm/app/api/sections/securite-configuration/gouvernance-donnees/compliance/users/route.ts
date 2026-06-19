import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import type { RhComplianceStatus } from '@/lib/gestion-ressources/rh-conformite-compliance';
import { listGlobalComplianceUsers } from '@/lib/governance/global-user-compliance';

const STATUSES = new Set<RhComplianceStatus>(['COMPLIANT', 'WARNING', 'NON_COMPLIANT']);

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') || 1));
  const limit = Math.min(200, Math.max(1, Number(sp.get('limit') || 20)));
  const query = sp.get('q') || undefined;
  const complianceStatusParam = sp.get('complianceStatus') || undefined;
  const complianceStatus =
    complianceStatusParam && STATUSES.has(complianceStatusParam as RhComplianceStatus)
      ? (complianceStatusParam as RhComplianceStatus)
      : undefined;

  const hasIssues = sp.get('hasIssues') === '1';

  try {
    const result = await listGlobalComplianceUsers({
      page,
      limit,
      query,
      complianceStatus: hasIssues ? undefined : complianceStatus,
      hasIssues,
      roleSlug: sp.get('roleSlug') || undefined,
      userCategory: sp.get('userCategory') || undefined,
    });
    return ok(result);
  } catch (e) {
    return fail('Impossible de charger la conformité.', 500, e);
  }
}
