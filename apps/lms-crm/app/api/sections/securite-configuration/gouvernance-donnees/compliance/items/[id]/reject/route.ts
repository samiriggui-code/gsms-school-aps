import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { ComplianceService } from '@repo/api-core';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason) return fail('Motif de refus requis.', 400);

  try {
    const service = new ComplianceService(prisma);
    const dossier = await service.rejectDossierItem(id, session.user.id, reason);
    return ok({ dossier });
  } catch (e) {
    return fail('Refus impossible.', 500, e);
  }
}
