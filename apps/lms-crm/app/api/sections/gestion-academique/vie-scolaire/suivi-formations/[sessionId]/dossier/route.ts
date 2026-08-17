import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  closeSessionDossier,
  getSessionDossierStatus,
} from '@/lib/suivi-formations/session-dossier-close';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId } = await context.params;

  try {
    const status = await getSessionDossierStatus(sessionId);
    return ok(status);
  } catch (error) {
    return fail('Impossible de lire le statut du dossier.', 500, error);
  }
}

/** Clôture le dossier session : legal hold + manifeste JSON archivé (tous les documents restent téléchargeables). */
export async function POST(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { sessionId } = await context.params;

  let body: { notes?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const result = await closeSessionDossier({
      sessionId,
      closedById: sessionAuth.user.id,
      notes: body.notes,
    });
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'DOSSIER_ALREADY_CLOSED') {
      return fail('Ce dossier session est déjà clôturé.', 409);
    }
    if (error instanceof Error && error.message === 'SESSION_NOT_FOUND') {
      return fail('Session introuvable.', 404);
    }
    return fail('Impossible de clôturer le dossier session.', 500, error);
  }
}
