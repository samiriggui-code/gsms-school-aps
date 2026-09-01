import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { loadParticipantPresenceHistory } from '@/lib/suivi-formations/session-emargement-service';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ sessionId: string; participantId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { sessionId, participantId } = await context.params;

  try {
    const participant = await prisma.formationSessionParticipant.findFirst({
      where: { id: participantId, sessionId },
      select: { id: true },
    });
    if (!participant) return fail('Stagiaire introuvable.', 404);

    const items = await loadParticipantPresenceHistory(sessionId, participantId);
    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger la présence.', 500, error);
  }
}
