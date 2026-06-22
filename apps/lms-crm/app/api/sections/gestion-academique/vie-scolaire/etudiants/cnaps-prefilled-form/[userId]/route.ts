import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  buildCnapsPrefilledPdf,
  cnapsPrefilledFilename,
} from '@/lib/cnaps/build-cnaps-prefilled-pdf';
import { cnapsPrefilledPdfResponse } from '@/lib/cnaps/cnaps-http-response';
import { resolveCnapsFormPayload } from '@/lib/cnaps/resolve-cnaps-form-data';

type Ctx = { params: Promise<{ userId: string }> };

/** Génère le formulaire CNAPS officiel prérempli (overlay pdf-lib sur le modèle fév. 2026). */
export async function GET(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { userId } = await context.params;
  const candidatureId = request.nextUrl.searchParams.get('candidatureId');

  try {
    const payload = await resolveCnapsFormPayload({
      userId,
      candidatureId,
    });
    const buffer = await buildCnapsPrefilledPdf(payload);
    return cnapsPrefilledPdfResponse(buffer, {
      filename: cnapsPrefilledFilename(payload.candidate.lastName),
      missingFields: payload.missingFields,
    });
  } catch (error) {
    console.error('[cnaps-prefilled-form]', error);
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return fail('Candidat introuvable.', 404);
    }
    if (error instanceof Error && error.message === 'CNAPS_TEMPLATE_MISSING') {
      return fail('Modèle PDF CNAPS introuvable sur le serveur.', 500);
    }
    return fail('Impossible de générer le formulaire CNAPS prérempli.', 500, error);
  }
}

export async function POST(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { userId } = await context.params;

  let body: { candidatureId?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const payload = await resolveCnapsFormPayload({
      userId,
      candidatureId: body.candidatureId ?? null,
    });
    const buffer = await buildCnapsPrefilledPdf(payload);
    return cnapsPrefilledPdfResponse(buffer, {
      filename: cnapsPrefilledFilename(payload.candidate.lastName),
      missingFields: payload.missingFields,
    });
  } catch (error) {
    console.error('[cnaps-prefilled-form]', error);
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return fail('Candidat introuvable.', 404);
    }
    return fail('Impossible de générer le formulaire CNAPS prérempli.', 500, error);
  }
}
