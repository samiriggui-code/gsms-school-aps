import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildComplianceDashboard } from '@/lib/of/compliance-dashboard';

/** GET — agrégats lecture seule tableau de bord conformité organisme. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const data = await buildComplianceDashboard(prisma);
    return ok(data);
  } catch (e) {
    console.error('[conformite/dashboard] GET', e);
    return fail('Failed to load compliance dashboard', 500);
  }
}
