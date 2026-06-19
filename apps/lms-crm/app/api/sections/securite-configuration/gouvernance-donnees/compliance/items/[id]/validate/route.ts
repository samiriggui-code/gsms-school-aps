import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { ComplianceService } from '@repo/api-core';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { id } = await context.params;

  try {
    const service = new ComplianceService(prisma);
    const dossier = await service.validateDossierItem(id, session.user.id);
    return ok({ dossier });
  } catch (e) {
    return fail('Validation impossible.', 500, e);
  }
}
