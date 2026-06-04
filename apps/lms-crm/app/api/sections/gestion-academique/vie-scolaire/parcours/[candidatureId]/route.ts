import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CandidatureParcoursService } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ candidatureId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { candidatureId } = await context.params;
  const service = new CandidatureParcoursService(prisma);
  const data = await service.getParcours(candidatureId);

  if (!data) return fail('Candidature introuvable.', 404);
  return ok(data);
}
