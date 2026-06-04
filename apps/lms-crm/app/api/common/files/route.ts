import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { uploadFile } from '@repo/storage';

type PrismaFileVisibility = 'PRIVATE' | 'INTERNAL' | 'PUBLIC';

function toVisibility(value: string | null): PrismaFileVisibility {
  const normalized = (value || 'PRIVATE').toUpperCase();
  if (normalized === 'PUBLIC') return 'PUBLIC';
  if (normalized === 'INTERNAL') return 'INTERNAL';
  return 'PRIVATE';
}

function visibilityToStorage(v: PrismaFileVisibility): 'private' | 'internal' | 'public' {
  if (v === 'PUBLIC') return 'public';
  if (v === 'INTERNAL') return 'internal';
  return 'private';
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

  const url = new URL(request.url);
  const moduleName = (url.searchParams.get('module') || '').trim();
  const entityType = (url.searchParams.get('entityType') || '').trim();
  const entityId = (url.searchParams.get('entityId') || '').trim();

  const items = await prisma.fileAsset.findMany({
    where: {
      status: 'ACTIVE',
      ...(moduleName ? { module: moduleName } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ data: items });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  const moduleName = String(formData.get('module') || '').trim();
  const entityType = String(formData.get('entityType') || '').trim();
  const entityId = String(formData.get('entityId') || '').trim() || null;
  const category = String(formData.get('category') || '').trim() || null;
  const visibility = toVisibility(String(formData.get('visibility') || 'PRIVATE'));

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'file is required' }, { status: 400 });
  }
  if (!moduleName || !entityType) {
    return NextResponse.json({ message: 'module and entityType are required' }, { status: 400 });
  }

  const uploaded = await uploadFile({
    file,
    module: moduleName,
    entityType,
    entityId,
    category,
    visibility: visibilityToStorage(visibility),
  });

  const asset = await prisma.fileAsset.create({
    data: {
      module: moduleName,
      entityType,
      entityId,
      category,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility,
      provider: 's3',
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ data: asset }, { status: 201 });
}
