import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

/** KPIs module IA — AiRun / AiArtifact. */
export async function GET() {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.pilotageView);
  if (!auth.ok) return auth.response;

  try {
    const [proposed, approved, rejected, runsTotal, runsFailed] = await Promise.all([
      prisma.aiArtifact.count({ where: { status: 'PROPOSED' } }),
      prisma.aiArtifact.count({ where: { status: 'APPROVED' } }),
      prisma.aiArtifact.count({ where: { status: 'REJECTED' } }),
      prisma.aiRun.count(),
      prisma.aiRun.count({ where: { status: 'FAILED' } }),
    ]);

    return ok({
      proposed,
      approved,
      rejected,
      runsTotal,
      runsFailed,
    });
  } catch (e) {
    return fail('Stats IA indisponibles.', 500, e);
  }
}
