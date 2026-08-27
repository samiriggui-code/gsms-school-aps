import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { deleteFileByKey, resolveKeyFromUrl } from '@repo/storage';
import { canManageFileAsset } from '@/lib/file-asset-service';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

  const { id } = await params;

  const asset = await prisma.fileAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ message: 'File not found' }, { status: 404 });
  if (!canManageFileAsset(session, asset)) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const data: {
    issuedAt?: Date | null;
    expiresAt?: Date | null;
    issuedBy?: string | null;
    documentRef?: string | null;
  } = {};

  if ('issuedAt' in body) {
    data.issuedAt = body.issuedAt ? new Date(body.issuedAt as string) : null;
  }
  if ('expiresAt' in body) {
    data.expiresAt = body.expiresAt ? new Date(body.expiresAt as string) : null;
  }
  if ('issuedBy' in body) {
    data.issuedBy = typeof body.issuedBy === 'string' ? body.issuedBy.trim() || null : null;
  }
  if ('documentRef' in body) {
    data.documentRef = typeof body.documentRef === 'string' ? body.documentRef.trim() || null : null;
  }

  const updated = await prisma.fileAsset.update({
    where: { id },
    data,
    select: {
      id: true,
      originalName: true,
      issuedAt: true,
      expiresAt: true,
      issuedBy: true,
      documentRef: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.fileAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ message: 'File not found' }, { status: 404 });
  if (!canManageFileAsset(session, asset)) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }

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
