import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { PILOTAGE_REPORT_ENTITY, PILOTAGE_REPORT_MODULE, PilotageHubService } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { id } = await params;
  let body: { label?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  if (!body.label?.trim() && body.description === undefined) {
    return fail('Aucune modification fournie.', 400);
  }

  try {
    const service = new PilotageHubService(prisma);
    const row = await service.updateReportMeta(id, {
      label: body.label?.trim(),
      description: body.description,
    }, session.user.id);
    if (!row) return fail('Rapport introuvable.', 404);
    return ok({ row });
  } catch (error) {
    console.error('[pilotage-rapports-patch]', error);
    return fail('Mise à jour impossible.', 500, error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { id } = await params;
  const asset = await prisma.fileAsset.findFirst({
    where: {
      id,
      module: PILOTAGE_REPORT_MODULE,
      entityType: PILOTAGE_REPORT_ENTITY,
      status: 'ACTIVE',
    },
  });
  if (!asset) return fail('Rapport introuvable.', 404);

  await prisma.fileAsset.update({
    where: { id },
    data: { status: 'DELETED', deletedAt: new Date() },
  });

  return ok({ success: true });
}
