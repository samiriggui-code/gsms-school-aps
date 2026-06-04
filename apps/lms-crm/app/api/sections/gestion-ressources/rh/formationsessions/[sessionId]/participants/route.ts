import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import {
  getFormationSessionParticipants,
  postFormationSessionParticipant,
} from '../../../../_lib/rh-session-participants';

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  const { sessionId } = await params;
  return getFormationSessionParticipants(sessionId);
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  const { sessionId } = await params;
  return postFormationSessionParticipant(sessionId, request);
}
