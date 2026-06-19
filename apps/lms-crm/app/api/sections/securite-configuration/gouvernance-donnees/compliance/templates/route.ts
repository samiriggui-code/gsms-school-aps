import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { ComplianceService } from '@repo/api-core';
import type { ComplianceDossierKind, ComplianceSubjectType } from '@repo/database';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const service = new ComplianceService(prisma);
    const templates = await service.listTemplates();
    return ok({ templates });
  } catch (e) {
    return fail('Impossible de charger les modèles de dossier.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const kind = body.kind as ComplianceDossierKind | undefined;
  const subjectType = body.subjectType as ComplianceSubjectType | undefined;
  const subjectId = typeof body.subjectId === 'string' ? body.subjectId : undefined;

  if (!kind || !subjectType || !subjectId) {
    return fail('kind, subjectType et subjectId sont requis.', 400);
  }

  try {
    const service = new ComplianceService(prisma);
    const dossier = await service.ensureDossier({
      kind,
      subjectType,
      subjectId,
      userId: typeof body.userId === 'string' ? body.userId : null,
      candidatureId: typeof body.candidatureId === 'string' ? body.candidatureId : null,
      formationId: typeof body.formationId === 'string' ? body.formationId : null,
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : null,
    });
    const summary = await service.evaluateDossier(dossier.id);
    return ok({ dossier: summary });
  } catch (e) {
    return fail('Impossible de créer le dossier conformité.', 500, e);
  }
}
