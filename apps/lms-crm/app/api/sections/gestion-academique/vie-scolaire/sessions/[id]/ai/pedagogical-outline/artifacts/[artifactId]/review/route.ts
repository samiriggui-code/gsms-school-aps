import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { reviewAiArtifact } from '@/lib/ai/ai-run-service';

type Ctx = { params: Promise<{ id: string; artifactId: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

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
    console.error('[ai/pedagogical-outline review]', e);
    return fail('Revue impossible.', 500, e);
  }
}
