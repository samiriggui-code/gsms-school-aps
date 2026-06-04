import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import { patchRhCandidature } from '../../../_lib/rh-candidatures-handlers';

type Params = { params: Promise<{ candidatureId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  const { candidatureId } = await params;
  return patchRhCandidature(candidatureId, request);
}
