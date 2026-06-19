import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { addFileAssetVersion } from '@/lib/file-asset-service';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get('file');
  const changeReason = String(formData.get('changeReason') ?? 'Nouvelle version').trim();

  if (!(file instanceof File) || file.size === 0) {
    return fail('Fichier requis.', 400);
  }

  try {
    const updated = await addFileAssetVersion({
      assetId: id,
      file,
      changeReason,
      createdById: session.user.id,
    });
    return ok({ asset: updated });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Version impossible.', 400);
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  const versions = await prisma.fileAssetVersion.findMany({
    where: { fileAssetId: id },
    orderBy: { versionNumber: 'desc' },
  });
  return ok({ versions });
}
