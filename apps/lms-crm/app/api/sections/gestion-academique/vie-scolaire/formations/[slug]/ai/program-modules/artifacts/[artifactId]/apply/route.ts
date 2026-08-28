import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { applyFormationProgramModulesArtifact } from '@/lib/ai/formation-program-modules-ai';

type Ctx = { params: Promise<{ slug: string; artifactId: string }> };

/** Applique un artefact APPROVED sur `Formation.programModules` (refuse tout autre statut). */
export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { artifactId } = await context.params;

  try {
    const result = await applyFormationProgramModulesArtifact({ artifactId });
    return ok(result);
  } catch (e) {
    console.error('[ai/program-modules apply]', e);
    const message = e instanceof Error ? e.message : 'Application impossible.';
    return fail(message, 409, e);
  }
}
