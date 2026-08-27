import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { buildSessionConventionPdf } from '@/lib/vie-scolaire/session-convention-pdf';
import { storeSessionConventionPdfAsset } from '@/lib/vie-scolaire/session-convention-store';

type Ctx = { params: Promise<{ id: string }> };

const sessionInclude = {
  formation: { select: { name: true, description: true } },
  trainer: { select: { name: true, firstName: true, lastName: true } },
  participants: {
    where: { enrollmentStatus: 'CONFIRMED' as const },
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      fundingMode: true,
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

/** Génère (et archive) le PDF de conventions pour les participants confirmés d'une session. */
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
    const { buffer, filename } = await buildSessionConventionPdf({
      formationName: row.formation.name,
      formationDescription: row.formation.description,
      sessionLabel: row.dateDisplayLabel,
      startDate: row.startDate,
      endDate: row.endDate,
      location: row.location,
      trainerName,
      participants: row.participants.map((p) => ({
        participantId: p.id,
        name: participantName(p.user),
        email: p.user.email,
        fundingMode: p.fundingMode,
      })),
    });

    let archivedFileAssetId: string | null = null;
    if (session.user?.id) {
      try {
        const asset = await storeSessionConventionPdfAsset({
          sessionId: id,
          buffer,
          filename,
          createdById: session.user.id,
          participantCount: row.participants.length,
        });
        archivedFileAssetId = asset.id;
      } catch (archiveError) {
        console.error('[session convention archive]', archiveError);
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
    console.error('[session convention pdf]', e);
    return fail('Génération PDF impossible.', 500, e);
  }
}
