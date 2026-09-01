import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { PILOTAGE_REPORT_ENTITY, PILOTAGE_REPORT_MODULE } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { getStoredFile } from '@repo/storage';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.pilotageView)) {
    return fail('Forbidden', 403);
  }

  const { id } = await params;
  const asset = await prisma.fileAsset.findFirst({
    where: {
      id,
      module: PILOTAGE_REPORT_MODULE,
      entityType: PILOTAGE_REPORT_ENTITY,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });
  if (!asset?.storageKey) return fail('Rapport introuvable.', 404);

  try {
    const stored = await getStoredFile(asset.storageKey);
    if (!stored) return fail('Fichier introuvable sur le stockage.', 404);

    return new Response(new Uint8Array(stored.body), {
      status: 200,
      headers: {
        'Content-Type': stored.contentType || asset.mimeType,
        'Content-Disposition': `attachment; filename="${asset.originalName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[pilotage-rapports-download]', error);
    return fail('Téléchargement impossible.', 500, error);
  }
}
