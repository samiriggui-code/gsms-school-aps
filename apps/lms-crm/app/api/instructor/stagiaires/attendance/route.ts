import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getInstructorContext } from '@/lib/instructor/instructor-auth';
import { assertInstructorOwnsSession } from '@/lib/instructor/instructor-access';
import { listAttendanceParticipants } from '@/lib/instructor/instructor-trainees-data';
import { buildSessionAttendancePdfBuffer, buildBlankSessionAttendancePdfBuffer } from '@/lib/instructor/session-attendance-pdf';
import {
  listSessionAttendanceAssets,
  storeSessionAttendanceGenerated,
  storeSessionAttendanceScan,
} from '@/lib/instructor/session-attendance-assets';

export const runtime = 'nodejs';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDateParam(value: string | null): string {
  const v = value?.trim();
  if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return todayIsoDate();
}

function pdfResponse(buffer: Buffer, filename: string) {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

/** Liste des archives présence + métadonnées session. `?template=blank` → modèle vierge PDF. */
export async function GET(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const template = request.nextUrl.searchParams.get('template');
  if (template === 'blank') {
    const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim();
    const attendanceDate = parseDateParam(request.nextUrl.searchParams.get('date'));

    let blankInput: Parameters<typeof buildBlankSessionAttendancePdfBuffer>[0] = {
      attendanceDate,
      trainerName: auth.ctx.user.name ?? auth.ctx.user.email,
    };

    if (sessionId) {
      const access = await assertInstructorOwnsSession(auth.ctx.userId, sessionId);
      if (!access.ok) return fail(access.message, access.status);
      blankInput = {
        ...blankInput,
        formationName: access.session.formation.name,
        sessionLabel: access.session.dateDisplayLabel,
        location: access.session.location,
      };
    }

    try {
      const { buffer, filename } = await buildBlankSessionAttendancePdfBuffer(blankInput);
      return pdfResponse(buffer, filename);
    } catch (e) {
      return fail('Impossible de générer le modèle vierge.', 500, e);
    }
  }

  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim();
  if (!sessionId) return fail('sessionId est requis.', 400);

  const access = await assertInstructorOwnsSession(auth.ctx.userId, sessionId);
  if (!access.ok) return fail(access.message, access.status);

  try {
    const archives = await listSessionAttendanceAssets(sessionId);

    return ok({
      session: {
        id: access.session.id,
        label: access.session.dateDisplayLabel,
        location: access.session.location,
        formationName: access.session.formation.name,
      },
      archives,
    });
  } catch (e) {
    return fail('Impossible de charger les documents de présence.', 500, e);
  }
}

/** Génère la feuille de présence PDF (téléchargement + archivage). */
export async function POST(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  let body: { sessionId?: string; date?: string; action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) return fail('sessionId est requis.', 400);

  const access = await assertInstructorOwnsSession(auth.ctx.userId, sessionId);
  if (!access.ok) return fail(access.message, access.status);

  const action = body.action ?? 'generate-pdf';
  const attendanceDate = parseDateParam(body.date ?? null);

  if (action === 'generate-blank-pdf') {
    try {
      const { buffer, filename } = await buildBlankSessionAttendancePdfBuffer({
        formationName: access.session.formation.name,
        sessionLabel: access.session.dateDisplayLabel,
        location: access.session.location,
        trainerName: auth.ctx.user.name ?? auth.ctx.user.email,
        attendanceDate,
      });

      await storeSessionAttendanceGenerated({
        sessionId,
        buffer,
        filename,
        attendanceDate,
        createdById: auth.ctx.userId,
      }).catch(() => undefined);

      return pdfResponse(buffer, filename);
    } catch (e) {
      return fail('Impossible de générer le modèle vierge.', 500, e);
    }
  }

  if (action === 'generate-pdf') {
    try {
      const participants = await listAttendanceParticipants(sessionId, auth.ctx.userId);
      const trainerName = auth.ctx.user.name ?? auth.ctx.user.email;

      const { buffer, filename } = await buildSessionAttendancePdfBuffer({
        formationName: access.session.formation.name,
        sessionLabel: access.session.dateDisplayLabel,
        location: access.session.location,
        trainerName,
        attendanceDate,
        participants,
      });

      await storeSessionAttendanceGenerated({
        sessionId,
        buffer,
        filename,
        attendanceDate,
        createdById: auth.ctx.userId,
      }).catch(() => undefined);

      return pdfResponse(buffer, filename);
    } catch (e) {
      return fail('Impossible de générer la feuille de présence.', 500, e);
    }
  }

  return fail('Action non reconnue.', 400);
}

/** Upload feuille scannée (multipart). */
export async function PUT(request: NextRequest) {
  const auth = await getInstructorContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const formData = await request.formData();
  const file = formData.get('file');
  const sessionId = String(formData.get('sessionId') || '').trim();
  const attendanceDate = parseDateParam(String(formData.get('date') || ''));

  if (!(file instanceof File)) return fail('file est requis.', 400);
  if (!sessionId) return fail('sessionId est requis.', 400);

  const access = await assertInstructorOwnsSession(auth.ctx.userId, sessionId);
  if (!access.ok) return fail(access.message, access.status);

  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return fail('Format accepté : PDF, JPEG, PNG, WebP.', 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === 'application/pdf' ? 'pdf' : file.name.split('.').pop() ?? 'scan';
    const filename = `presence-scan_${access.session.formation.slug}_${attendanceDate}.${ext}`;

    const asset = await storeSessionAttendanceScan({
      sessionId,
      buffer,
      filename,
      mimeType: file.type,
      attendanceDate,
      createdById: auth.ctx.userId,
    });

    return ok({
      id: asset.id,
      url: asset.url,
      originalName: asset.originalName,
      attendanceDate,
    });
  } catch (e) {
    return fail('Impossible d’archiver la feuille scannée.', 500, e);
  }
}
