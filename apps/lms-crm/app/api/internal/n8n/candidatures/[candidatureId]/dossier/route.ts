import { NextRequest } from 'next/server';
import { verifyN8nInternalAuth, fetchCandidatureDossier } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ candidatureId: string }> },
) {
  if (!verifyN8nInternalAuth(request.headers)) {
    return fail('Unauthorized request', 401);
  }

  const { candidatureId } = await context.params;
  if (!candidatureId?.trim()) {
    return fail('candidatureId requis', 400);
  }

  const dossier = await fetchCandidatureDossier(prisma, candidatureId.trim());
  if (!dossier) {
    return fail('Candidature introuvable', 404);
  }

  return ok(dossier);
}
