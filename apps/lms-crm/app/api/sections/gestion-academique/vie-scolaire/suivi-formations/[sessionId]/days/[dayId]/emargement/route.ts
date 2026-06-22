import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import type { FormationSessionDaySlot, FormationSessionEmargementStatus } from '@repo/database';

const EMARGEMENT_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
import {
  generateEmargementPdfForSlot,
  saveEmargementMarks,
  type EmargementMarkInput,
} from '@/lib/suivi-formations/session-emargement-service';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ sessionId: string; dayId: string }> };

function isValidSlot(value: unknown): value is FormationSessionDaySlot {
  return value === 'MORNING' || value === 'EVENING';
}

function isValidStatus(value: unknown): value is FormationSessionEmargementStatus {
  return (
    typeof value === 'string' &&
    (EMARGEMENT_STATUSES as readonly string[]).includes(value)
  );
}

/** Enregistre les émargements nominatifs pour un créneau. */
export async function PATCH(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { sessionId, dayId } = await context.params;

  let body: {
    slot?: string;
    marks?: EmargementMarkInput[];
    journalNotes?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  if (!isValidSlot(body.slot)) {
    return fail('slot invalide (MORNING | EVENING).', 422);
  }

  const marks = Array.isArray(body.marks) ? body.marks : [];
  for (const mark of marks) {
    if (!mark.participantId || !isValidStatus(mark.status)) {
      return fail('marks invalides.', 422);
    }
  }

  try {
    await saveEmargementMarks({
      dayId,
      slot: body.slot,
      marks,
      markedByUserId: sessionAuth.user.id,
      journalNotes: body.journalNotes,
    });

    return ok({ saved: marks.length, sessionId, dayId, slot: body.slot });
  } catch (error) {
    if (error instanceof Error && error.message === 'DAY_NOT_FOUND') {
      return fail('Jour introuvable.', 404);
    }
    return fail('Impossible d’enregistrer l’émargement.', 500, error);
  }
}

/** Génère le PDF émargement pour matin ou soir et l’archive MinIO. */
export async function POST(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { sessionId, dayId } = await context.params;

  let body: { slot?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  if (!isValidSlot(body.slot)) {
    return fail('slot invalide (MORNING | EVENING).', 422);
  }

  try {
    const result = await generateEmargementPdfForSlot({
      dayId,
      slot: body.slot,
      createdById: sessionAuth.user.id,
    });

    return ok({
      sessionId,
      dayId,
      slot: body.slot,
      asset: result.asset,
      presentCount: result.presentCount,
      markedCount: result.markedCount,
      participantTotal: result.participantTotal,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'DAY_NOT_FOUND') {
      return fail('Jour introuvable.', 404);
    }
    return fail('Impossible de générer le PDF émargement.', 500, error);
  }
}
