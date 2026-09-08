import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireGestionRessourcesView } from '../../_lib/require-gestion-ressources-auth';
import { evaluateSessionQualiopi } from '@/lib/of/qualiopi-session-evaluate';
import { QualiopiSessionNotFoundError } from '@/lib/of/qualiopi-evaluation-types';

/**
 * GET — Stress test Qualiopi session (Q1/Q2).
 * Lecture seule : règles pilotes déterministes, aucune écriture.
 * Query : sessionId (obligatoire).
 */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim() ?? '';
  if (!sessionId) {
    return fail('Paramètre sessionId requis.', 422);
  }

  try {
    const data = await evaluateSessionQualiopi(prisma, sessionId);
    return ok(data);
  } catch (e) {
    if (e instanceof QualiopiSessionNotFoundError) {
      return fail('Session introuvable.', 404);
    }
    console.error('[qualiopi/evaluate] GET', e);
    return fail('Évaluation Qualiopi session impossible.', 500, e);
  }
}
