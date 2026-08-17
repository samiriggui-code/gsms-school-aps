import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { loadSuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context';

type Ctx = { params: Promise<{ sessionId: string }> };

/** Contexte enrichi session (formateur, salle, planning) pour les sheets suivi formations. */
export async function GET(_request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth) return fail('Unauthorized request', 401);

  const { sessionId } = await context.params;

  try {
    const sessionContext = await loadSuiviSessionContext(sessionId);
    if (!sessionContext) return fail('Session introuvable.', 404);
    return ok(sessionContext);
  } catch (error) {
    return fail('Impossible de charger le contexte session.', 500, error);
  }
}
