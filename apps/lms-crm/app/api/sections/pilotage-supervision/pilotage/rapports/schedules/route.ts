import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { ReportScheduleService, ReportGenerationSkippedError } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  try {
    const service = new ReportScheduleService(prisma);
    const schedules = await service.list(session.user.id);
    return ok({ schedules });
  } catch (error) {
    console.error('[pilotage-rapports-schedules]', error);
    return fail('Impossible de charger les planifications.', 500, error);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: { id?: string; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const id = body.id?.trim();
  if (!id) return fail('id requis.', 400);
  if (typeof body.enabled !== 'boolean') return fail('enabled (boolean) requis.', 400);

  try {
    const service = new ReportScheduleService(prisma);
    const schedule = await service.setEnabled(id, body.enabled);
    if (!schedule) return fail('Planification introuvable.', 404);
    return ok({ schedule });
  } catch (error) {
    console.error('[pilotage-rapports-schedules-patch]', error);
    return fail('Mise à jour impossible.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const id = body.id?.trim();
  if (!id) return fail('id requis.', 400);

  try {
    const service = new ReportScheduleService(prisma);
    const result = await service.runNow(id, session.user.id);
    if (!result) return fail('Planification introuvable.', 404);
    if (result.skipped) {
      return ok({
        skipped: true,
        message: result.skipReason,
        existingJobId: result.existingJobId,
        existingFileAssetId: result.existingFileAssetId,
        schedule: result.schedule,
      });
    }
    return ok({ jobId: result.jobId, schedule: result.schedule });
  } catch (error) {
    if (error instanceof ReportGenerationSkippedError) {
      return fail(error.message, 409, {
        code: error.code,
        existingJobId: error.existingJobId,
        existingFileAssetId: error.existingFileAssetId,
      });
    }
    console.error('[pilotage-rapports-schedules-run]', error);
    const message = error instanceof Error ? error.message : 'Lancement impossible.';
    return fail(message, 500, error);
  }
}
