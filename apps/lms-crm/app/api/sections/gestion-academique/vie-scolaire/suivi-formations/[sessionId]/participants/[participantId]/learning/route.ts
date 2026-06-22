import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { loadParticipantLearningDetail } from '@/lib/suivi-formations/participant-learning';

type Ctx = { params: Promise<{ sessionId: string; participantId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId, participantId } = await context.params;

  try {
    const detail = await loadParticipantLearningDetail({ sessionId, participantId });
    if (!detail) return fail('Stagiaire introuvable.', 404);
    return ok(detail);
  } catch (error) {
    return fail('Impossible de charger la progression.', 500, error);
  }
}
