import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { reviewAiArtifact } from '@/lib/ai/ai-run-service';

/** Revue hub : PROPOSED → APPROVED | REJECTED (apply métier reste sur la cible). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.pilotageView);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: { approve?: boolean };
  try {
    body = (await request.json()) as { approve?: boolean };
  } catch {
    return fail('JSON invalide', 400);
  }
  if (typeof body.approve !== 'boolean') {
    return fail('approve (boolean) requis', 400);
  }

  try {
    const existing = await prisma.aiArtifact.findUnique({ where: { id } });
    if (!existing) return fail('Artefact introuvable', 404);
    if (existing.status !== 'PROPOSED') {
      return fail(`Artefact non PROPOSED (statut: ${existing.status})`, 409);
    }

    const updated = await reviewAiArtifact(id, {
      reviewedById: auth.userId,
      approve: body.approve,
    });

    return ok({
      id: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Revue impossible', 500, e);
  }
}
