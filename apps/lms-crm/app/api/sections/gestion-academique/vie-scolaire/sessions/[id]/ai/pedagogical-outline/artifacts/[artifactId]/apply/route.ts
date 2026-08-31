import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { applySessionPedagogicalOutlineArtifact } from '@/lib/ai/session-pedagogical-outline-ai';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ id: string; artifactId: string }> };

export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { artifactId } = await context.params;

  try {
    const result = await applySessionPedagogicalOutlineArtifact({ artifactId });
    return ok(result);
  } catch (e) {
    console.error('[ai/pedagogical-outline apply]', e);
    const message = e instanceof Error ? e.message : 'Application impossible.';
    return fail(message, 409, e);
  }
}
