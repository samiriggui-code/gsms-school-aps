import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  buildSessionConformiteExportCsv,
  conformiteExportLabel,
  type ConformiteExportVariant,
} from '@/lib/suivi-formations/conformite-export';
import { storeConformiteExportCsv } from '@/lib/suivi-formations/session-document-store';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ sessionId: string }> };

function parseVariant(value: unknown): ConformiteExportVariant | null {
  if (value === 'cpf' || value === 'france-travail' || value === 'all') return value;
  return null;
}

/** Génère un export CSV conformité, l’archive MinIO et renvoie le lien. */
export async function POST(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { sessionId } = await context.params;

  let body: { variant?: string; download?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const variant = parseVariant(body.variant ?? 'all');
  if (!variant) return fail('variant invalide (cpf | france-travail | all).', 422);

  try {
    const { buffer, filename, rowCount } = await buildSessionConformiteExportCsv({
      sessionId,
      variant,
    });

    if (rowCount === 0) {
      return fail(`Aucun stagiaire éligible pour l’export « ${conformiteExportLabel(variant)} ».`, 422);
    }

    const asset = await storeConformiteExportCsv({
      sessionId,
      variant,
      buffer,
      filename,
      createdById: sessionAuth.user.id,
      rowCount,
    });

    if (body.download) {
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return ok({
      id: asset.id,
      url: asset.url,
      originalName: asset.originalName,
      rowCount,
      variant,
      label: conformiteExportLabel(variant),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_NOT_FOUND') {
      return fail('Session introuvable.', 404);
    }
    return fail('Impossible de générer l’export conformité.', 500, error);
  }
}
