import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import type { FormationSessionDaySlot } from '@repo/database';
import { loadEmargementReportPayload } from '@/lib/suivi-formations/emargement-report-payload';
import { loadDayDetail } from '@/lib/suivi-formations/session-emargement-service';

type Ctx = { params: Promise<{ sessionId: string; dayId: string }> };

function isValidSlot(value: string | null): value is FormationSessionDaySlot {
  return value === 'MORNING' || value === 'EVENING';
}

/** Payload rapport émargement (aperçu HTML = PDF). */
export async function GET(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth) return fail('Unauthorized request', 401);

  const { sessionId, dayId } = await context.params;
  const slotParam = request.nextUrl.searchParams.get('slot');
  if (!isValidSlot(slotParam)) {
    return fail('Paramètre slot requis (MORNING | EVENING).', 422);
  }

  try {
    const detail = await loadDayDetail(dayId);
    if (!detail || detail.day.sessionId !== sessionId) {
      return fail('Jour introuvable.', 404);
    }

    const origin = request.nextUrl.origin;
    const payload = await loadEmargementReportPayload(dayId, slotParam, origin);
    if (!payload) return fail('Impossible de construire le rapport.', 500);

    return ok(payload);
  } catch (error) {
    return fail('Impossible de charger le rapport émargement.', 500, error);
  }
}
