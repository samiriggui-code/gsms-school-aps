import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { reviewAiArtifact } from '@/lib/ai/ai-run-service';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ slug: string; artifactId: string }> };

/** Revue humaine d'un brouillon IA : approve → APPROVED (prêt pour apply), sinon REJECTED. */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { artifactId } = await context.params;

  let body: { approve?: unknown } = {};
  try {
    body = (await request.json()) as { approve?: unknown };
  } catch {
    return fail('Corps JSON invalide.', 400);
  }
  if (typeof body.approve !== 'boolean') {
    return fail('Champ "approve" (booléen) requis.', 400);
  }

  try {
    const artifact = await reviewAiArtifact(artifactId, {
      reviewedById: session.user.id,
      approve: body.approve,
    });
    return ok({ artifact });
  } catch (e) {
    console.error('[ai/program-modules review]', e);
    return fail('Revue impossible.', 500, e);
  }
}