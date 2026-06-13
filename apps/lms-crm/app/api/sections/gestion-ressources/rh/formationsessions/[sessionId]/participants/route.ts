import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../../_lib/require-gestion-ressources-auth';
import { fail } from '@/app/api/_shared/http/response';
import {
  getFormationSessionParticipants,
  postFormationSessionParticipant,
} from '../../../../_lib/rh-session-participants';

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

const { sessionId } = await params;
  return getFormationSessionParticipants(sessionId);
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;
  const { sessionId } = await params;
  return postFormationSessionParticipant(sessionId, request);
}
