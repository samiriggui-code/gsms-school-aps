import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { draftSessionPedagogicalOutline } from '@/lib/ai/session-pedagogical-outline-ai';

type Ctx = { params: Promise<{ id: string }> };

/** GSMS-AI-03 — brouillon déroulé pédagogique (AiArtifact PROPOSED uniquement). */
export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { id } = await context.params;
  if (!id?.trim()) return fail('Session id manquant.', 400);

  try {
    const row = await prisma.formationSession.findUnique({
      where: { id: id.trim() },
      select: { id: true },
    });
    if (!row) return fail('Session introuvable.', 404);

    const result = await draftSessionPedagogicalOutline({
      sessionId: row.id,
      requestedById: session.user.id,
    });
    return ok(result, 201);
  } catch (e) {
    console.error('[ai/pedagogical-outline draft]', e);
    return fail('Génération du brouillon impossible.', 500, e);
  }
}
