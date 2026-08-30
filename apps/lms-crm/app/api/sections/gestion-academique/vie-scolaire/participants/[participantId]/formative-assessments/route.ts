import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  createFormativeAssessment,
  listFormativeAssessments,
} from '@/lib/vie-scolaire/formative-assessment-service';

type Ctx = { params: Promise<{ participantId: string }> };

/** WF-21 — liste des évaluations formatives d'un participant. */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { participantId } = await context.params;
  const exists = await prisma.formationSessionParticipant.findUnique({
    where: { id: participantId },
    select: { id: true },
  });
  if (!exists) return fail('Participant introuvable.', 404);

  const items = await listFormativeAssessments(prisma, participantId);
  return ok({
    items: items.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      sessionDay: i.sessionDay
        ? { id: i.sessionDay.id, dayDate: i.sessionDay.dayDate.toISOString() }
        : null,
    })),
  });
}

/** WF-21 — enregistre une évaluation formative. */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { participantId } = await context.params;
  let body: {
    label?: string;
    score?: number | null;
    passed?: boolean | null;
    feedback?: string | null;
    sessionDayId?: string | null;
  } = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  if (!body.label?.trim()) return fail('label requis.', 400);

  try {
    const row = await createFormativeAssessment(prisma, {
      participantId,
      label: body.label,
      score: typeof body.score === 'number' ? body.score : body.score === null ? null : undefined,
      passed: typeof body.passed === 'boolean' ? body.passed : body.passed === null ? null : undefined,
      feedback: typeof body.feedback === 'string' ? body.feedback : undefined,
      sessionDayId: body.sessionDayId ?? null,
      recordedById: session.user?.id ?? null,
    });
    return ok(
      {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
      201,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    if (msg === 'PARTICIPANT_NOT_FOUND') return fail('Participant introuvable.', 404);
    if (msg === 'SESSION_DAY_NOT_FOUND') return fail('Jour de session introuvable.', 400);
    if (msg === 'LABEL_REQUIRED') return fail('label requis.', 400);
    throw e;
  }
}
