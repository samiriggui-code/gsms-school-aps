import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { ComplianceService } from '@repo/api-core';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.conformiteView)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;

  try {
    const service = new ComplianceService(prisma);
    const summary = await service.getDossierSummary(id);
    if (!summary) return fail('Dossier introuvable.', 404);
    return ok({ dossier: summary });
  } catch (e) {
    return fail('Impossible de charger le dossier.', 500, e);
  }
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.conformiteEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;

  try {
    const service = new ComplianceService(prisma);
    const summary = await service.evaluateDossier(id);
    return ok({ dossier: summary });
  } catch (e) {
    return fail('Impossible d’évaluer le dossier.', 500, e);
  }
}
