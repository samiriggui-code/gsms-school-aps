import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ fileId: string }> };

export async function PATCH(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)) {
    return fail('Forbidden', 403);
  }

  const { fileId } = await context.params;

  try {
    const row = await prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!row) return fail('Fichier introuvable.', 404);
    if (!row.deletedAt) return fail('Fichier non supprimé.', 400);

    await prisma.fileAsset.update({
      where: { id: fileId },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
    return ok({ restored: true });
  } catch (e) {
    return fail('Restauration impossible.', 500, e);
  }
}
