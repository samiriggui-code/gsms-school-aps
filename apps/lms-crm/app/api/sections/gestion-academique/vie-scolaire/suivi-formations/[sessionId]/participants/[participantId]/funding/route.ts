import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { isSuiviFundingModeKey } from '@/lib/suivi-formations/funding-modes';
import { resolveParticipantFunding } from '@/lib/suivi-formations/resolve-participant-funding';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ sessionId: string; participantId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId, participantId } = await context.params;

  try {
    const row = await prisma.formationSessionParticipant.findFirst({
      where: { id: participantId, sessionId },
      select: {
        fundingMode: true,
        fundingReference: true,
        fundingNotes: true,
        candidature: { select: { notes: true, metadata: true } },
      },
    });
    if (!row) return fail('Stagiaire introuvable.', 404);

    return ok(resolveParticipantFunding(row));
  } catch (error) {
    return fail('Impossible de charger le financeur.', 500, error);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { sessionId, participantId } = await context.params;

  let body: {
    fundingMode?: string | null;
    fundingReference?: string | null;
    fundingNotes?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  if (
    body.fundingMode !== undefined &&
    body.fundingMode !== null &&
    body.fundingMode !== '' &&
    !isSuiviFundingModeKey(body.fundingMode)
  ) {
    return fail('Mode financeur invalide.', 422);
  }

  try {
    const existing = await prisma.formationSessionParticipant.findFirst({
      where: { id: participantId, sessionId },
      select: { id: true },
    });
    if (!existing) return fail('Stagiaire introuvable.', 404);

    const updated = await prisma.formationSessionParticipant.update({
      where: { id: participantId },
      data: {
        ...(body.fundingMode !== undefined
          ? { fundingMode: body.fundingMode?.trim() || null }
          : {}),
        ...(body.fundingReference !== undefined
          ? { fundingReference: body.fundingReference?.trim() || null }
          : {}),
        ...(body.fundingNotes !== undefined
          ? { fundingNotes: body.fundingNotes?.trim() || null }
          : {}),
      },
      select: {
        fundingMode: true,
        fundingReference: true,
        fundingNotes: true,
        candidature: { select: { notes: true, metadata: true } },
      },
    });

    return ok(resolveParticipantFunding(updated));
  } catch (error) {
    return fail('Impossible de mettre à jour le financeur.', 500, error);
  }
}
