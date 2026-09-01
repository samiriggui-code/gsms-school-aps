import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import {
  generateFormationExamPdf,
  buildFormationExamPdfRowFromPrisma,
  type FormationExamPdfDocType,
} from '@/lib/vie-scolaire/formation-exam-pdf';
import { storeFormationExamPdfAsset } from '@/lib/vie-scolaire/formation-exam-document-store';
import type { FormationExamOfficialDocType } from '@/lib/vie-scolaire/formation-exam-documents';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ id: string; docType: string }> };

const DOC_TYPES: FormationExamPdfDocType[] = ['candidats', 'emargement', 'convocation', 'jury'];

const examPdfInclude = {
  venueRoom: {
    select: { name: true, shortCode: true, floorLabel: true },
  },
  session: {
    select: {
      dateDisplayLabel: true,
      location: true,
      examDate: true,
      traineesMin: true,
      traineesMax: true,
      trainer: {
        select: { name: true, firstName: true, lastName: true, email: true },
      },
      formation: { select: { name: true, duration: true } },
      examVenueRoom: {
        select: { name: true, shortCode: true, floorLabel: true },
      },
      participants: {
        where: { enrollmentStatus: 'CONFIRMED' as const },
        orderBy: { createdAt: 'asc' as const },
        select: {
          user: {
            select: {
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  },
};

export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { id, docType } = await context.params;
  if (!DOC_TYPES.includes(docType as FormationExamPdfDocType)) {
    return fail('Type de document invalide (candidats, emargement, convocation, jury).', 400);
  }

  const archiveParam = request.nextUrl.searchParams.get('archive');
  const shouldArchive = archiveParam !== '0';

  const row = await prisma.formationExam.findUnique({
    where: { id },
    include: examPdfInclude,
  });

  if (!row) return fail('Examen introuvable.', 404);

  try {
    const pdfRow = buildFormationExamPdfRowFromPrisma(row);
    const { buffer, filename } = await generateFormationExamPdf(
      docType as FormationExamPdfDocType,
      pdfRow,
    );

    let archivedFileAssetId: string | null = null;
    if (shouldArchive && session.user?.id) {
      try {
        const asset = await storeFormationExamPdfAsset({
          examId: id,
          sessionId: row.sessionId,
          docType: docType as FormationExamOfficialDocType,
          buffer,
          filename,
          createdById: session.user.id,
          participantCount: pdfRow.session.participants.length,
        });
        archivedFileAssetId = asset.id;
      } catch (archiveError) {
        console.error('[formation-exam pdf archive]', archiveError);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    };
    if (archivedFileAssetId) {
      headers['X-Archived-File-Asset-Id'] = archivedFileAssetId;
    }

    return new Response(new Uint8Array(buffer), { status: 200, headers });
  } catch (e) {
    console.error('[formation-exam pdf]', e);
    return fail('Génération PDF impossible.', 500, e);
  }
}
