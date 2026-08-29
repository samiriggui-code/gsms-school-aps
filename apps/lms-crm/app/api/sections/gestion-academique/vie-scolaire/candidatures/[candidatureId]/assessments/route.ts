import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  bootstrapNeedsAnalysisForCandidature,
  sendAssessmentInvite,
} from '@/lib/of/candidature-assessment-service';

type Ctx = { params: Promise<{ candidatureId: string }> };

/** Liste les assessments WF-02/03 d'une candidature (+ flag adaptation). */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { candidatureId } = await context.params;
  const items = await prisma.candidatureAssessment.findMany({
    where: { candidatureId },
    orderBy: { kind: 'asc' },
    select: {
      id: true,
      kind: true,
      status: true,
      sentAt: true,
      completedAt: true,
      adaptationRequired: true,
      level: true,
      prerequisitesStatus: true,
    },
  });

  return ok({
    items: items.map((i) => ({
      ...i,
      sentAt: i.sentAt?.toISOString() ?? null,
      completedAt: i.completedAt?.toISOString() ?? null,
    })),
    adaptationRequired: items.some((i) => i.adaptationRequired === true),
  });
}

/** Relance / bootstrap questionnaire (needs analysis ou invite manuelle). */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { candidatureId } = await context.params;
  const exists = await prisma.candidature.findUnique({
    where: { id: candidatureId },
    select: { id: true },
  });
  if (!exists) return fail('Candidature introuvable.', 404);

  let body: { assessmentId?: string; kind?: string } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as typeof body;
  } catch {
    /* optional */
  }

  if (body.assessmentId?.trim()) {
    const result = await sendAssessmentInvite(prisma, body.assessmentId.trim(), request);
    return ok(result);
  }

  const result = await bootstrapNeedsAnalysisForCandidature(prisma, candidatureId, request);
  return ok(result);
}
