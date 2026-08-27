import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { buildSessionConvocationPdf } from '@/lib/vie-scolaire/session-convocation-pdf';
import { storeSessionConvocationPdfAsset } from '@/lib/vie-scolaire/session-convocation-store';

type Ctx = { params: Promise<{ id: string }> };

const sessionInclude = {
  formation: { select: { name: true } },
  trainer: { select: { name: true, firstName: true, lastName: true } },
  venueRoom: { select: { name: true, shortCode: true } },
  participants: {
    where: { enrollmentStatus: 'CONFIRMED' as const },
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      user: { select: { name: true, firstName: true, lastName: true, email: true } },
    },
  },
} as const;

function participantName(user: { name: string | null; firstName: string | null; lastName: string | null }): string {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    'Participant'
  );
}

function venueLabel(room: { name: string; shortCode: string | null } | null): string | null {
  if (!room) return null;
  return [room.name, room.shortCode ? `(${room.shortCode})` : null].filter(Boolean).join(' ');
}

/** Génère (et archive) le PDF de convocations pour les participants confirmés d'une session. */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  const row = await prisma.formationSession.findUnique({ where: { id }, include: sessionInclude });
  if (!row) return fail('Session introuvable.', 404);

  const trainerName =
    row.trainer?.name?.trim() ||
    [row.trainer?.firstName, row.trainer?.lastName].filter(Boolean).join(' ').trim() ||
    null;

  try {
    const { buffer, filename } = await buildSessionConvocationPdf({
      formationName: row.formation.name,
      sessionLabel: row.dateDisplayLabel,
      startDate: row.startDate,
      location: row.location,
      venueLabel: venueLabel(row.venueRoom),
      trainerName,
      participants: row.participants.map((p) => ({
        participantId: p.id,
        name: participantName(p.user),
        email: p.user.email,
      })),
    });

    let archivedFileAssetId: string | null = null;
    if (session.user?.id) {
      try {
        const asset = await storeSessionConvocationPdfAsset({
          sessionId: id,
          buffer,
          filename,
          createdById: session.user.id,
          participantCount: row.participants.length,
        });
        archivedFileAssetId = asset.id;
      } catch (archiveError) {
        console.error('[session convocation archive]', archiveError);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    };
    if (archivedFileAssetId) headers['X-Archived-File-Asset-Id'] = archivedFileAssetId;

    return new Response(new Uint8Array(buffer), { status: 200, headers });
  } catch (e) {
    console.error('[session convocation pdf]', e);
    return fail('Génération PDF impossible.', 500, e);
  }
}