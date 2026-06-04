import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { deleteFileByKey, resolveKeyFromUrl } from '@repo/storage';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.fileAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ message: 'File not found' }, { status: 404 });

  const key = asset.storageKey || resolveKeyFromUrl(asset.url || '') || '';
  if (key) {
    await deleteFileByKey(key).catch(() => null);
  }

  await prisma.fileAsset.update({
    where: { id },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
